import { Viewpoint } from '@vcmap/core';
import { reactive } from 'vue';
import { StateActionState } from '../actions/stateRefAction.js';
import {
  createGoToViewpointAction,
  createModalAction,
} from '../actions/actionHelper.js';
import component from '../actions/StyleSelector.vue';
import VcsObjectContentTreeItem from './vcsObjectContentTreeItem.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import { contentTreeClassRegistry } from './contentTreeItem.js';
import { executeCallbacks } from '../callback/vcsCallback.js';

/**
 * @typedef {ContentTreeItemOptions} LayerContentTreeItemOptions
 * @property {string} layerName
 */

/**
 * @typedef {VcsObjectContentTreeItemProperties} LayerContentTreeItemProperties
 * @property {Array<string>} [availableStyles]
 * @property {string} [defaultViewpoint] - the name the default viewpoint
 */

/**
 * @param {ContentTreeItem} item
 * @param {VcsUiApp} app
 * @param {string=} viewpoint
 */
export function setViewpointAction(item, app, viewpoint) {
  const name = 'ViewpointAction';
  item.removeAction(name);

  if (viewpoint) {
    const action = createGoToViewpointAction(
      {
        name,
        icon: 'mdi-crosshairs-gps',
      },
      viewpoint,
      app.viewpoints,
      app.maps,
    );
    item.addAction(action, 2);
  }
}

/**
 * @param {import("@vcmap/core").Layer} layer
 * @returns {StateActionState}
 */
export function getStateFromLayer(layer) {
  if (layer.active) {
    return StateActionState.ACTIVE;
  } else if (layer.loading) {
    return StateActionState.LOADING;
  }
  return StateActionState.INACTIVE;
}

/**
 * A layer item. Activates/deactivates the layer when clicked.
 * @class
 * @extends {VcsObjectContentTreeItem<LayerContentTreeItemProperties>}
 */
class LayerContentTreeItem extends VcsObjectContentTreeItem {
  /**
   * @todo this has to be refactored, just so we can read the config as is
   * @returns {string}
   */
  static get className() {
    return 'LayerContentTreeItem';
  }

  /**
   * @param {LayerContentTreeItemOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);
    this.state = StateActionState.INACTIVE;

    /**
     * @type {string}
     * @private
     */
    this._layerName = options.layerName;

    /**
     * @type {Array<Function>}
     * @private
     */
    this._listeners = [];

    this._setup();
  }

  /**
   * @type {import("@vcmap/core").Layer}
   * @private
   */
  get _layer() {
    return this._app.layers.getByKey(this._layerName);
  }

  /**
   * @param {Array<string>=} availableStyles
   * @private
   */
  _setStyleAction(availableStyles) {
    const name = 'StyleSelector';
    this.removeAction(name);
    if (Array.isArray(availableStyles)) {
      const { action, destroy } = createModalAction(
        {
          name,
          icon: '$vcsColorSwatch',
          title: 'content.styleAction.title',
        },
        {
          component,
          position: {
            width: 200,
          },
          props: reactive({
            availableStyles: availableStyles.slice(),
            layerName: this._layerName,
          }),
        },
        this._app,
        vcsAppSymbol,
      );
      this.addAction(action, 4);
      this._listeners.push(destroy);
    }
  }

  /**
   * @private
   */
  _setLayerExtentAction() {
    const name = 'content.layerExtentAction.name';
    this.removeAction(name);
    if (this._layer) {
      const { extent } = this._layer.toJSON();
      if (extent) {
        const viewpoint = Viewpoint.createViewpointFromExtent(
          this._layer.extent,
        );
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
  }

  /**
   * @param {LayerContentTreeItemProperties} properties
   * @protected
   */
  _setProperties(properties) {
    super._setProperties(properties);

    this._setStyleAction(properties.availableStyles);
    setViewpointAction(this, this._app, properties.defaultViewpoint);
  }

  /**
   * @private
   */
  _clearListeners() {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  /**
   * @private
   */
  _setup() {
    this._clearListeners();
    /**
     * Called when a layer is added or removed to reset the item if needed
     * @param {import("@vcmap/core").Layer} layer
     */
    const resetHandler = (layer) => {
      if (layer.name === this._layerName) {
        this._setup();
      }
    };

    if (!this._layer) {
      this.visible = false;
      this._listeners.push(
        this._app.layers.added.addEventListener(resetHandler),
      );
    } else {
      this.visible = this._layer.isSupported(this._app.maps.activeMap);
      this.state = getStateFromLayer(this._layer);
      this._setLayerExtentAction();
      this.setPropertiesFromObject(this._layer);

      this._listeners.push(
        this._app.layers.removed.addEventListener(resetHandler),
      );
      this._listeners.push(
        this._app.layers.added.addEventListener(resetHandler),
      );

      this._listeners.push(
        this._layer.stateChanged.addEventListener(() => {
          this.state = getStateFromLayer(this._layer);
        }),
      );

      this._listeners.push(
        this._app.maps.mapActivated.addEventListener(() => {
          this.visible = this._layer.isSupported(this._app.maps.activeMap);
        }),
      );
    }
  }

  async clicked() {
    await super.clicked();
    if (this._layer) {
      if (this.state === StateActionState.INACTIVE) {
        await this._layer.activate();
        executeCallbacks(this._app, this._onActivate);
      } else {
        this._layer.deactivate();
        executeCallbacks(this._app, this._onDeactivate);
      }
    }
  }

  /**
   * @returns {LayerContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.layerName = this._layerName;
    return config;
  }

  destroy() {
    super.destroy();
    this._clearListeners();
  }
}

export default LayerContentTreeItem;
contentTreeClassRegistry.registerClass(
  LayerContentTreeItem.className,
  LayerContentTreeItem,
);
