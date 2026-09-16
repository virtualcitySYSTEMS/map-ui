import { getLogger } from '@vcsuite/logger';
import { parseBoolean } from '@vcsuite/parsers';
import type { Layer, VcsMap } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import ContentTreeItem, {
  type ContentTreeItemOptions,
  contentTreeClassRegistry,
} from './contentTreeItem.js';
import {
  getStateFromLayer,
  setStyleAction,
  setViewpointAction,
} from './layerContentTreeItem.js';
import { StateActionState } from '../actions/stateRefAction.js';
import { executeCallbacks } from '../callback/vcsCallback.js';

type LayerGroupContentTreeItemOptions = ContentTreeItemOptions & {
  /** list of LayerNames which should be activated on click */
  layerNames: string[];
  /** optional flag to show the item even if it is not supported by the activeMap. */
  showWhenNotSupported?: boolean;
  /** the name of an optional default viewpoint */
  defaultViewpoint?: string;
  availableStyles?: string[];
};

function getStateFromLayers(layers: Layer[]): StateActionState {
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
 */
class LayerGroupContentTreeItem extends ContentTreeItem {
  static get className(): string {
    return 'LayerGroupContentTreeItem';
  }

  private _layerNames: string[];
  private _showWhenNotSupported: boolean;
  private _listeners: Array<() => void> = [];
  private _defaultViewpoint: string | undefined;
  private _availableStyles: string[];

  constructor(options: LayerGroupContentTreeItemOptions, app: VcsUiApp) {
    super(options, app);
    this.state = StateActionState.INACTIVE;

    this._layerNames = Array.isArray(options.layerNames)
      ? options.layerNames.slice()
      : [];
    this._showWhenNotSupported = parseBoolean(
      options.showWhenNotSupported,
      false,
    );
    this._defaultViewpoint = options.defaultViewpoint;
    this._availableStyles = Array.isArray(options.availableStyles)
      ? options.availableStyles.slice()
      : [];

    this._setup();
  }

  private get _layers(): Layer[] {
    return this._layerNames
      .map((n) => this._app.layers.getByKey(n))
      .filter((l) => !!l);
  }

  private _clearListeners(): void {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  private _determineSupport(): void {
    const isSupported = this._layers.some((l) =>
      l.isSupported(this._app.maps.activeMap!),
    );

    this.visible = isSupported || this._showWhenNotSupported;
    if (this._showWhenNotSupported) {
      this.disabled = !isSupported;
    }
  }

  private _setup(): void {
    this._clearListeners();
    /**
     * Called when a layer is added or removed to reset the item if needed
     * @param {import("@vcmap/core").Layer} layer
     */
    const resetHandler = (layer: Layer): void => {
      if (this._layerNames.includes(layer.name)) {
        this._setup();
      }
    };

    let supportedLayersListener = (): void => {};

    const setActiveMap = (map: VcsMap | null): void => {
      supportedLayersListener();
      this._determineSupport();
      supportedLayersListener = map
        ? map.layerTypesChanged.addEventListener(() => {
            this._determineSupport();
          })
        : (): void => {};
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

  async clicked(): Promise<void> {
    await super.clicked();
    const layers = this._layers;
    const activate = layers.some((l) => !(l.active || l.loading));
    if (activate) {
      await Promise.all(
        layers.map((l) =>
          l.activate().catch((e: unknown) => {
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

  toJSON(): LayerGroupContentTreeItemOptions {
    const config = super.toJSON() as LayerGroupContentTreeItemOptions;
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

  destroy(): void {
    this._clearListeners();
    super.destroy();
  }
}

export default LayerGroupContentTreeItem;
contentTreeClassRegistry.registerClass(
  LayerGroupContentTreeItem.className,
  LayerGroupContentTreeItem,
);
