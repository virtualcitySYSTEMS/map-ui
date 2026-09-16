import { type Extent, VcsEvent, Viewpoint } from '@vcmap/core';
import { reactive, computed, watch } from 'vue';
import type VcsUiApp from '../vcsUiApp.js';
import ContentTreeItem, {
  type ContentTreeItemOptions,
} from './contentTreeItem.js';
import type { WMSEntry } from './wmsGroupContentTreeItem.js';
import {
  type VcsAction,
  callSafeAction,
  createGoToViewpointAction,
  createModalAction,
} from '../actions/actionHelper.js';
import { StateActionState } from '../actions/stateRefAction.js';
import VcsActionList from '../components/lists/VcsActionList.ts.vue';
import { vcsAppSymbol } from '../pluginHelper.js';

type WMSChildItemOptions = ContentTreeItemOptions & {
  wmsEntry: WMSEntry;
  hideStyleSelector?: boolean;
};

/**
 * A WMS child layer. Toggles this child in the parent WMS layer.
 */
class WmsChildContentTreeItem extends ContentTreeItem {
  static get className(): string {
    return 'WmsChildContentTreeItem';
  }

  private _wmsEntry: WMSEntry;
  private _stateWatcher: () => void;
  clickedEvent = new VcsEvent<void>();
  styleSelected = new VcsEvent<string>();
  // eslint-disable-next-line class-methods-use-this
  private _destroyStyleAction: () => void = () => {};

  constructor(options: WMSChildItemOptions, app: VcsUiApp) {
    super(options, app);

    this._wmsEntry = options.wmsEntry;
    this._stateWatcher = watch(
      this._wmsEntry.active,
      () => {
        if (this._wmsEntry.active.value) {
          this.state = StateActionState.ACTIVE;
        } else {
          this.state = StateActionState.INACTIVE;
        }
      },
      { immediate: true },
    );

    this._setExtentAction(this._wmsEntry.extent);
    if (!options.hideStyleSelector) {
      this._setStyleAction();
    }
  }

  get wmsEntry(): WMSEntry {
    return this._wmsEntry;
  }

  private _setExtentAction(extent?: Extent): void {
    const name = 'content.layerExtentAction.name';
    this.removeAction(name);
    if (extent) {
      const viewpoint = Viewpoint.createViewpointFromExtent(extent);
      if (viewpoint) {
        const action = createGoToViewpointAction(
          { name, title: 'content.layerExtentAction.title' },
          viewpoint,
          this._app.viewpoints,
          this._app.maps,
        );
        this.addAction(action, 8);
      }
    }
  }

  private _setStyleAction(): void {
    const name = 'content.wmsStyleAction.name';
    this.removeAction(name);
    let modalAction: VcsAction | null = null;
    if (this._wmsEntry.styles && this._wmsEntry.styles.length > 1) {
      const styleActions = this._wmsEntry.styles.map((style) => {
        return reactive({
          name: style.title,
          active: computed(
            () => style.name === this.wmsEntry.activeStyle.value,
          ),
          callback: () => {
            this.styleSelected.raiseEvent(style.name);
            if (modalAction) {
              callSafeAction(modalAction);
            }
          },
        });
      });
      const { action, destroy } = createModalAction(
        { name, icon: '$vcsColorSwatch', title: 'content.styleAction.title' },
        {
          component: VcsActionList,
          position: { width: 200 },
          props: { actions: styleActions },
        },
        this._app,
        vcsAppSymbol,
      );
      modalAction = action;
      this._destroyStyleAction = destroy;
      this.addAction(action);
    }
  }

  async clicked(): Promise<void> {
    await super.clicked();
    this.clickedEvent.raiseEvent();
  }

  destroy(): void {
    super.destroy();
    this._stateWatcher();
    this.clickedEvent.destroy();
    this.styleSelected.destroy();
    this._destroyStyleAction();
  }
}

export default WmsChildContentTreeItem;
