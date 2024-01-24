import { CesiumMap, BaseOLMap } from '@vcmap/core';
import { unByKey } from 'ol/Observable.js';
import { check } from '@vcsuite/check';
import ContextMenuInteraction from './contextMenuInteraction.js';
import { vcsAppSymbol } from '../../pluginHelper.js';
import { validateAction } from '../../components/lists/VcsActionList.vue';
import { WindowSlot } from '../window/windowManager.js';
import { getFittedWindowPositionOptionsFromMapEvent } from '../window/windowHelper.js';
import ContextMenuComponent, {
  contextMenuWindowId,
} from './ContextMenuComponent.vue';
import { sortByOwner } from '../navbarManager.js';

/**
 * @typedef {Object} ContextMenuEventHandler
 * @property {string|symbol} owner
 * @property {function(import("@vcmap/core").InteractionEvent):Promise<Array<import("../../actions/actionHelper.js").VcsAction>>|Array<import("../../actions/actionHelper.js").VcsAction>} handler
 */

/**
 * @param {import("@vcmap/core").VcsMap} map
 * @param {function():void} clear
 * @returns {function():void} - returns stop listener function.
 */
function setupViewpointChanged(map, clear) {
  const currentViewpoint = map.getViewpointSync();
  const postRenderHandler = () => {
    if (!currentViewpoint.equals(map.getViewpointSync(), 0.001)) {
      clear();
    }
  };

  if (map instanceof CesiumMap) {
    return map.getScene().postRender.addEventListener(postRenderHandler);
  } else if (map instanceof BaseOLMap) {
    const key = map.olMap.on('postrender', postRenderHandler);
    return () => {
      unByKey(key);
    };
  }
  return () => {};
}

/**
 * The context menu manager handles right click events in the current map and displays a
 * context menu based on registered action providers.
 * @class
 */
class ContextMenuManager {
  /**
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(app) {
    /**
     * @type {import("@src/vcsUiApp.js").default}
     * @private
     */
    this._app = app;
    /**
     * @type {ContextMenuInteraction}
     * @private
     */
    this._interaction = new ContextMenuInteraction(
      this._handleRightClick.bind(this),
      async () => {
        this.clear();
      },
    );
    /**
     * @type {Array<ContextMenuEventHandler>}
     * @private
     */
    this._eventHandlers = [];
    /**
     * @type {function():void|null}
     * @private
     */
    this._interactionListener = null;
    /**
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [];
  }

  _ensureInteraction() {
    if (!this._interactionListener) {
      this._interactionListener =
        this._app.maps.eventHandler.addPersistentInteraction(this._interaction);
    }
  }

  _setupListeners() {
    const clear = this.clear.bind(this);
    this._listeners = [
      this._app.layers.stateChanged.addEventListener(clear),
      this._app.maps.mapActivated.addEventListener(clear),
      setupViewpointChanged(this._app.maps.activeMap, clear),
    ];
  }

  /**
   * @param {import("@vcmap/core").InteractionEvent} event
   * @private
   */
  async _handleRightClick(event) {
    this.clear();
    const actionArrays = await Promise.all(
      this._eventHandlers.map(({ handler }) => handler(event)),
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
        this._app.maps.target,
      );
      if (position.left) {
        // ensure we nudge the window, so it does not trigger the default right click.
        position.left += 1;
      } else {
        position.right += 1;
      }
      position.maxWidth = 320;
      position.width = -1; // unset width magic. dont touch.

      this._app.windowManager.add(
        {
          id: contextMenuWindowId,
          component: ContextMenuComponent,
          state: {
            hideHeader: true,
          },
          props: {
            actions,
            showIcon: true,
          },
          position,
          slow: WindowSlot.DETACHED,
        },
        vcsAppSymbol,
      );

      this._setupListeners();
    }
  }

  /**
   * Adds a handler to the context menu. A handler is called with the interaction event on each right click.
   * If the handler returns an array of valid actions, said actions will be displayed in the context menu
   * @param {function(import("@vcmap/core").InteractionEvent):Promise<Array<import("../../actions/actionHelper.js").VcsAction>>|Array<import("../../actions/actionHelper.js").VcsAction>} handler
   * @param {string|symbol} owner
   */
  addEventHandler(handler, owner) {
    check(handler, Function);
    check(owner, [String, vcsAppSymbol]);

    this._ensureInteraction();
    this._eventHandlers.push({ owner, handler });
    const order = [...this._app.plugins].map((p) => p.name);
    this._eventHandlers.sort((a, b) => {
      return sortByOwner(a.owner, b.owner, order);
    });
  }

  /**
   * Remove a single handler
   * @param {function(import("@vcmap/core").InteractionEvent):Promise<Array<import("../../actions/actionHelper.js").VcsAction>>|Array<import("../../actions/actionHelper.js").VcsAction>} handler
   */
  removeHandler(handler) {
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
   * @param {string|symbol} owner
   */
  removeOwner(owner) {
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
  clear() {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners = [];
    this._app.windowManager.remove(contextMenuWindowId);
  }

  destroy() {
    this._interaction.destroy();
    if (this._interactionListener) {
      this._interactionListener();
      this._interactionListener = null;
    }
    this._eventHandlers = [];
  }
}

export default ContextMenuManager;
