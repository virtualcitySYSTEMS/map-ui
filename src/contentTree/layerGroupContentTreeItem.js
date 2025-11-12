import { getLogger } from '@vcsuite/logger';
import { parseBoolean } from '@vcsuite/parsers';
import ContentTreeItem, {
  contentTreeClassRegistry,
} from './contentTreeItem.js';
import {
  getStateFromLayer,
  setStyleAction,
  setViewpointAction,
} from './layerContentTreeItem.js';
import { StateActionState } from '../actions/stateRefAction.js';
import { executeCallbacks } from '../callback/vcsCallback.js';

/**
 * @typedef {import("./contentTreeItem.js").ContentTreeItemOptions & { layerNames: string[], showWhenNotSupported?: boolean, defaultViewpoint?: string, availableStyles?: string[] }} LayerGroupContentTreeItemOptions
 * @property {Array<string>} layerNames list of LayerNames which should be activated on click
 * @property {boolean} [showWhenNotSupported=false] - optional flag to show the item even if it is not supported by the activeMap.
 * @property {string} [defaultViewpoint] - the name of an optional default viewpoint
 */

/**
 * @param {Array<import("@vcmap/core").Layer>} layers
 * @returns {StateActionState}
 */
function getStateFromLayers(layers) {
  const states = layers.map((l) => getStateFromLayer(l));
  if (states.some((s) => s === StateActionState.LOADING)) {
    return StateActionState.LOADING;
  }

  if (states.every((s) => s === StateActionState.INACTIVE)) {
    return StateActionState.INACTIVE;
  }

  if (states.every((s) => s === StateActionState.ACTIVE)) {
    return StateActionState.ACTIVE;
  }
  return StateActionState.INDETERMINATE;
}

/**
 * A layer group. When clicked will try to activate all layers in the group or deactivate all layer in the group if all are active.
 * @class
 * @extends {ContentTreeItem}
 */
class LayerGroupContentTreeItem extends ContentTreeItem {
  /**
   * @type {string}
   */
  static get className() {
    return 'LayerGroupContentTreeItem';
  }

  /**
   * @param {LayerGroupContentTreeItemOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);
    this.state = StateActionState.INACTIVE;
    /**
     * @type {Array<string>}
     * @private
     */
    this._layerNames = Array.isArray(options.layerNames)
      ? options.layerNames.slice()
      : [];

    /**
     * @type {boolean}
     * @private
     */
    this._showWhenNotSupported = parseBoolean(
      options.showWhenNotSupported,
      false,
    );

    /**
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [];

    /**
     * @type {string|undefined}
     * @private
     */
    this._defaultViewpoint = options.defaultViewpoint;

    /**
     * @type {string[]}
     * @private
     */
    this._availableStyles = Array.isArray(options.availableStyles)
      ? options.availableStyles.slice()
      : [];

    this._setup();
  }

  /**
   * @type {Array<import("@vcmap/core").Layer>}
   * @private
   */
  get _layers() {
    return this._layerNames
      .map((n) => this._app.layers.getByKey(n))
      .filter((l) => l);
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

  _determineSupport() {
    const isSupported = this._layers.some((l) =>
      l.isSupported(this._app.maps.activeMap),
    );

    this.visible = isSupported || this._showWhenNotSupported;
    if (this._showWhenNotSupported) {
      this.disabled = !isSupported;
    }
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
      if (this._layerNames.includes(layer.name)) {
        this._setup();
      }
    };

    let supportedLayersListener = () => {};

    const setActiveMap = (map) => {
      supportedLayersListener();
      this._determineSupport();
      supportedLayersListener = map
        ? map.layerTypesChanged.addEventListener(() => {
            this._determineSupport();
          })
        : () => {};
    };

    const layers = this._layers;
    setActiveMap(this._app.maps.activeMap);
    this.state = getStateFromLayers(layers);
    setViewpointAction(this, this._app, this._defaultViewpoint);
    setStyleAction(
      this,
      this._app,
      this._listeners,
      this._layerNames,
      this._availableStyles,
    );

    this._listeners.push(
      this._app.layers.removed.addEventListener(resetHandler),
      this._app.layers.added.addEventListener(resetHandler),
      ...layers.map((layer) =>
        layer.stateChanged.addEventListener(() => {
          this.state = getStateFromLayers(layers);
        }),
      ),
      this._app.maps.mapActivated.addEventListener(setActiveMap),
      () => {
        supportedLayersListener();
      },
    );
  }

  /**
   * @returns {Promise<void>}
   */
  async clicked() {
    await super.clicked();
    const layers = this._layers;
    const activate = layers.some((l) => !(l.active || l.loading));
    if (activate) {
      await Promise.all(
        layers.map((l) =>
          l.activate().catch((e) => {
            getLogger('LayerGroupContentTreeItem').error(
              `Could not activate layer ${l.name}`,
              e,
            );
          }),
        ),
      );
      executeCallbacks(this._app, this._onActivate);
    } else {
      layers.forEach((l) => {
        l.deactivate();
      });
      executeCallbacks(this._app, this._onDeactivate);
    }
  }

  /**
   * @returns {LayerGroupContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.layerNames = this._layerNames.slice();
    if (this._showWhenNotSupported) {
      config.showWhenNotSupported = this._showWhenNotSupported;
    }
    if (this._defaultViewpoint) {
      config.defaultViewpoint = this._defaultViewpoint;
    }
    if (this._availableStyles.length > 0) {
      config.availableStyles = this._availableStyles.slice();
    }
    return config;
  }

  /**
   * @inheritDoc
   */
  destroy() {
    this._clearListeners();
    super.destroy();
  }
}

export default LayerGroupContentTreeItem;
contentTreeClassRegistry.registerClass(
  LayerGroupContentTreeItem.className,
  LayerGroupContentTreeItem,
);
