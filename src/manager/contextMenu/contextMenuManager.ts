import type { InteractionEvent, VcsMap } from '@vcmap/core';
import { CesiumMap, BaseOLMap, VcsEvent } from '@vcmap/core';
import { unByKey } from 'ol/Observable.js';
import { check, oneOf } from '@vcsuite/check';
import type VcsUiApp from '../../vcsUiApp.js';
import ContextMenuInteraction from './contextMenuInteraction.js';
import { vcsAppSymbol } from '../../pluginHelper.js';
import { validateAction } from '../../components/lists/VcsActionList.ts.vue';
import { WindowSlot } from '../window/windowManager.js';
import { getFittedWindowPositionOptionsFromMapEvent } from '../window/windowHelper.js';
import ContextMenuComponent, {
  contextMenuWindowId,
} from './ContextMenuComponent.ts.vue';
import { sortByOwner } from '../navbarManager.js';
import type { VcsAction } from '../../actions/actionHelper.js';

type ContextMenuEventHandler = {
  owner: string | symbol;
  handler: (
    event: InteractionEvent,
  ) => Promise<Array<VcsAction>> | Array<VcsAction>;
};

function setupViewpointChanged(map: VcsMap, clear: () => void): () => void {
  const currentViewpoint = map.getViewpointSync();
  const postRenderHandler = (): void => {
    if (!currentViewpoint?.equals(map.getViewpointSync()!, 0.001)) {
      clear();
    }
  };

  if (map instanceof CesiumMap) {
    return map.getScene()!.postRender.addEventListener(postRenderHandler);
  } else if (map instanceof BaseOLMap) {
    const key = map.olMap!.on('postrender', postRenderHandler);
    return () => {
      unByKey(key);
    };
  }
  return () => {};
}

/**
 * The context menu manager handles right click events in the current map and displays a
 * context menu based on registered action providers.
 */
class ContextMenuManager {
  private _app: VcsUiApp;
  private _interaction = new ContextMenuInteraction(
    this._handleRightClick.bind(this),
    (): Promise<void> => {
      this.clear();
      return Promise.resolve();
    },
  );
  private _eventHandlers: Array<ContextMenuEventHandler> = [];
  private _interactionListener: (() => void) | null = null;
  private _listeners: Array<() => void> = [];
  /** An event called when the context menu is closed */
  closed = new VcsEvent<void>();
  private _closedListener: () => void;

  constructor(app: VcsUiApp) {
    this._app = app;
    this._closedListener = this._app.windowManager.removed.addEventListener(
      (window) => {
        if (window.id === contextMenuWindowId) {
          this.closed.raiseEvent();
        }
      },
    );
  }

  private _ensureInteraction(): void {
    if (!this._interactionListener) {
      this._interactionListener =
        this._app.maps.eventHandler.addPersistentInteraction(this._interaction);
    }
  }

  private _setupListeners(): void {
    const clear = this.clear.bind(this);
    this._listeners = [
      this._app.layers.stateChanged.addEventListener(clear),
      this._app.maps.mapActivated.addEventListener(clear),
      setupViewpointChanged(this._app.maps.activeMap!, clear),
    ];
  }

  private async _handleRightClick(event: InteractionEvent): Promise<void> {
    this.clear();
    const actionArrays = await Promise.all(
      this._eventHandlers.map(({ handler }) => Promise.resolve(handler(event))),
    );
    const actions = actionArrays
      .filter((i) => Array.isArray(i))
      .flatMap((i) => i)
      .filter(validateAction);

    if (actions.length > 0) {
      const position = getFittedWindowPositionOptionsFromMapEvent(
        event.windowPosition,
        320,
        actions.length * 32,
        this._app.maps.target!,
      );
      if (position.left) {
        // ensure we nudge the window, so it does not trigger the default right click.
        position.left = (position.left as number) + 1;
      } else {
        position.right = (position.right as number) + 1;
      }
      position.maxWidth = 320;
      position.width = -1; // unset width magic. dont touch.

      this._app.windowManager.add(
        {
          id: contextMenuWindowId,
          component: ContextMenuComponent,
          state: { hideHeader: true },
          props: { actions, showIcon: true },
          slot: WindowSlot.DETACHED,
          position,
        },
        vcsAppSymbol,
      );

      this._setupListeners();
    }
  }

  /**
   * Adds a handler to the context menu. A handler is called with the interaction event on each right click.
   * If the handler returns an array of valid actions, said actions will be displayed in the context menu
   */
  addEventHandler(
    handler: (
      event: InteractionEvent,
    ) => Promise<Array<VcsAction>> | Array<VcsAction>,
    owner: string | symbol,
  ): void {
    check(handler, Function);
    check(owner, oneOf(String, vcsAppSymbol));

    this._ensureInteraction();
    this._eventHandlers.push({ owner, handler });
    const order = [...this._app.plugins].map((p) => p.name);
    this._eventHandlers.sort((a, b) => {
      return sortByOwner(a.owner, b.owner, order);
    });
  }

  /**
   * Remove a single handler
   */
  removeHandler(
    handler: (
      event: InteractionEvent,
    ) => Promise<Array<VcsAction>> | Array<VcsAction>,
  ): void {
    this._eventHandlers = this._eventHandlers.filter(
      ({ handler: itemHandler }) => itemHandler !== handler,
    );
    if (this._eventHandlers.length === 0 && this._interactionListener) {
      this._interactionListener();
      this._interactionListener = null;
    }
  }

  /**
   * Remove all handlers associated with this owner
   */
  removeOwner(owner: string | symbol): void {
    this._eventHandlers = this._eventHandlers.filter(
      ({ owner: handlerOwner }) => handlerOwner !== owner,
    );
    if (this._eventHandlers.length === 0 && this._interactionListener) {
      this._interactionListener();
      this._interactionListener = null;
    }
  }

  /**
   * Clear any currently opened context menus
   */
  clear(): void {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners = [];
    this._app.windowManager.remove(contextMenuWindowId);
  }

  destroy(): void {
    this.clear();
    this._interaction.destroy();
    if (this._interactionListener) {
      this._interactionListener();
      this._interactionListener = null;
    }
    this._eventHandlers = [];
    this._closedListener();
    this.closed.destroy();
  }
}

export default ContextMenuManager;
