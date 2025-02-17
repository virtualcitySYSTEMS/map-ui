import { Viewpoint } from '@vcmap/core';
import { parseBoolean } from '@vcsuite/parsers';
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
 * @typedef {import("./contentTreeItem.js").ContentTreeItemOptions & { layerName: string, showWhenNotSupported?: boolean }} LayerContentTreeItemOptions
 * @property {boolean} [showWhenNotSupported=false] - optional flag to show the item even if it is not supported by the activeMap.
 */

/**
 * @typedef {import("./vcsObjectContentTreeItem.js").VcsObjectContentTreeItemProperties & { availableStyles?: string[], defaultViewpoint?: string }} LayerContentTreeItemProperties
 * @property {string} [defaultViewpoint] - the name the default viewpoint
 */

/**
 * @param {import("./contentTreeItem.js").default} item
 * @param {import("@src/vcsUiApp.js").default} app
 * @param {string|import("@vcmap/core").Viewpoint=} viewpoint
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
 * @param {import("./contentTreeItem.js").default} item
 * @param {import("@src/vcsUiApp.js").default} app
 * @param {Array<Function>} listeners
 * @param {Array<string>} layerNames
 * @param {Array<string>=} availableStyles
 */
export function setStyleAction(
  item,
  app,
  listeners,
  layerNames,
  availableStyles,
) {
  const name = 'StyleSelector';
  item.removeAction(name);
  if (Array.isArray(availableStyles) && availableStyles.length > 0) {
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
          layerNames: layerNames.slice(),
        }),
      },
      app,
      vcsAppSymbol,
    );
    item.addAction(action, 4);
    listeners.push(destroy);
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
   * @param {import("@src/vcsUiApp.js").default} app
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
     * @type {boolean}
     * @private
     */
    this._showWhenNotSupported = parseBoolean(
      options.showWhenNotSupported,
      false,
    );

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
    setStyleAction(
      this,
      this._app,
      this._listeners,
      [this._layerName],
      properties.availableStyles,
    );
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
      let isSupported = this._layer.isSupported(this._app.maps.activeMap);
      this.visible = isSupported || this._showWhenNotSupported;
      if (this._showWhenNotSupported) {
        this.disabled = !isSupported;
      }
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
          isSupported = this._layer.isSupported(this._app.maps.activeMap);
          this.visible = isSupported || this._showWhenNotSupported;
          if (this._showWhenNotSupported) {
            this.disabled = !isSupported;
          }
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
    if (this._showWhenNotSupported) {
      config.showWhenNotSupported = this._showWhenNotSupported;
    }
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
