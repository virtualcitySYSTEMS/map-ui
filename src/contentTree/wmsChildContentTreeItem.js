import { VcsEvent, Viewpoint } from '@vcmap/core';
import { reactive, computed, watch } from 'vue';
import {
  createGoToViewpointAction,
  createModalAction,
} from '../actions/actionHelper.js';
import { StateActionState } from '../actions/stateRefAction.js';
import ContentTreeItem from './contentTreeItem.js';
import VcsActionList from '../components/lists/VcsActionList.vue';
import { vcsAppSymbol } from '../pluginHelper.js';

/**
 * @typedef {import("./contentTreeItem.js").ContentTreeItemOptions &
 * { wmsEntry:import("./wmsGroupContentTreeItem.js").WMSEntry }} WMSChildItemOptions
 * @property {import("./wmsGroupContentTreeItem.js").WMSEntry} wmsEntry - the wmsEntry
 * @property {boolean} hideStyleSelector - hides the style selector
 */

/**
 * A WMS child layer. Toggles this child in the parent WMS layer.
 * @extends {ContentTreeItem}
 * @class
 */
class WmsChildContentTreeItem extends ContentTreeItem {
  static get className() {
    return 'WmsChildContentTreeItem';
  }

  /**
   * @param {WMSChildItemOptions} options
   * @param {import("../vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);

    /**
     * @type {import("./wmsGroupContentTreeItem.js").WMSEntry}
     */
    this._wmsEntry = options.wmsEntry;

    /**
     * @type {() => void}
     */
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

    /**
     * Event fires if the Item has been clicked
     * @type {VcsEvent<void>}
     */
    this.clickedEvent = new VcsEvent();

    /**
     * Event fires if a style has been selected
     * @type {VcsEvent<string>}
     */
    this.styleSelected = new VcsEvent();

    /**
     * @type {() => void}
     */
    this._destroyStyleAction = () => {};

    this._setExtentAction(this._wmsEntry.extent);
    if (!options.hideStyleSelector) {
      this._setStyleAction();
    }
  }

  /**
   * @type {import("./wmsGroupContentTreeItem.js").WMSEntry}
   */
  get wmsEntry() {
    return this._wmsEntry;
  }

  /**
   * @param {number[]} [extent]
   * @private
   */
  _setExtentAction(extent) {
    const name = 'content.layerExtentAction.name';
    this.removeAction(name);
    if (extent) {
      const viewpoint = Viewpoint.createViewpointFromExtent(extent);
      const action = createGoToViewpointAction(
        {
          name,
          title: 'content.layerExtentAction.title',
        },
        viewpoint,
        this._app.viewpoints,
        this._app.maps,
      );
      this.addAction(action, 8);
    }
  }

  _setStyleAction() {
    const name = 'content.wmsStyleAction.name';
    this.removeAction(name);
    let modalAction = null;
    if (this._wmsEntry.styles.length > 1) {
      const styleActions = this._wmsEntry.styles.map((style) => {
        return reactive({
          name: style.title,
          active: computed(
            () => style.name === this.wmsEntry.activeStyle.value,
          ),
          callback: () => {
            this.styleSelected.raiseEvent(style.name);
            modalAction?.callback();
          },
        });
      });
      const { action, destroy } = createModalAction(
        {
          name,
          icon: '$vcsColorSwatch',
          title: 'content.styleAction.title',
        },
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

  async clicked() {
    await super.clicked();
    this.clickedEvent.raiseEvent();
  }

  destroy() {
    super.destroy();
    this._stateWatcher();
    this.clickedEvent.destroy();
    this.styleSelected.destroy();
    this._destroyStyleAction();
  }
}

export default WmsChildContentTreeItem;
