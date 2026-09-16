import { Extent, type Layer, type VcsMap, Viewpoint } from '@vcmap/core';
import { parseBoolean } from '@vcsuite/parsers';
import { reactive } from 'vue';
import type VcsUiApp from '../vcsUiApp.js';
import { StateActionState } from '../actions/stateRefAction.js';
import {
  createGoToViewpointAction,
  createModalAction,
} from '../actions/actionHelper.js';
import component from '../actions/StyleSelector.ts.vue';
import VcsObjectContentTreeItem, {
  type VcsObjectContentTreeItemProperties,
} from './vcsObjectContentTreeItem.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import type ContentTreeItem from './contentTreeItem.js';
import {
  type ContentTreeItemOptions,
  contentTreeClassRegistry,
} from './contentTreeItem.js';
import { executeCallbacks } from '../callback/vcsCallback.js';

type LayerContentTreeItemOptions = ContentTreeItemOptions & {
  layerName: string;
  /** optional flag to show the item even if it is not supported by the activeMap. */
  showWhenNotSupported?: boolean;
};

type LayerContentTreeItemProperties = VcsObjectContentTreeItemProperties & {
  availableStyles?: string[];
  defaultViewpoint?: string;
};

export function setViewpointAction(
  item: ContentTreeItem,
  app: VcsUiApp,
  viewpoint?: string | Viewpoint,
): void {
  const name = 'ViewpointAction';
  item.removeAction(name);

  if (viewpoint) {
    const action = createGoToViewpointAction(
      { name, icon: 'mdi-target' },
      viewpoint,
      app.viewpoints,
      app.maps,
    );
    item.addAction(action, 2);
  }
}

export function setStyleAction(
  item: ContentTreeItem,
  app: VcsUiApp,
  listeners: Array<() => void>,
  layerNames: Array<string>,
  availableStyles?: Array<string>,
): void {
  const name = 'StyleSelector';
  item.removeAction(name);
  if (Array.isArray(availableStyles) && availableStyles.length > 0) {
    const { action, destroy } = createModalAction(
      { name, icon: '$vcsColorSwatch', title: 'content.styleAction.title' },
      {
        component,
        position: { width: 200 },
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

export function getStateFromLayer(layer: Layer): StateActionState {
  if (layer.active) {
    return StateActionState.ACTIVE;
  } else if (layer.loading) {
    return StateActionState.LOADING;
  }
  return StateActionState.INACTIVE;
}

/**
 * A layer item. Activates/deactivates the layer when clicked.
 */
class LayerContentTreeItem extends VcsObjectContentTreeItem<LayerContentTreeItemProperties> {
  /**
   * @todo this has to be refactored, just so we can read the config as is
   */
  static get className(): string {
    return 'LayerContentTreeItem';
  }

  private _layerName: string;
  private _showWhenNotSupported: boolean;
  private _listeners: Array<() => void> = [];

  constructor(options: LayerContentTreeItemOptions, app: VcsUiApp) {
    super(options, app);
    this.state = StateActionState.INACTIVE;

    this._layerName = options.layerName;

    this._showWhenNotSupported = parseBoolean(
      options.showWhenNotSupported,
      false,
    );

    this._setup();
  }

  private get _layer(): Layer {
    return this._app.layers.getByKey(this._layerName)!;
  }

  private _setLayerExtentAction(): void {
    const name = 'content.layerExtentAction.name';
    this.removeAction(name);
    if (this._layer) {
      const { extent } = this._layer.toJSON();
      if (extent) {
        const viewpoint = Viewpoint.createViewpointFromExtent(
          new Extent(extent),
        );
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
  }

  protected _setProperties(properties: LayerContentTreeItemProperties): void {
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

  private _clearListeners(): void {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  private _determineSupport(): void {
    const isSupported = this._layer.isSupported(this._app.maps.activeMap!);
    this.visible = isSupported || this._showWhenNotSupported;
    if (this._showWhenNotSupported) {
      this.disabled = !isSupported;
    }
  }

  private _setup(): void {
    this._clearListeners();
    /**
     * Called when a layer is added or removed to reset the item if needed
     */
    const resetHandler = (layer: Layer): void => {
      if (layer.name === this._layerName) {
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
    if (!this._layer) {
      this.visible = false;
      this._listeners.push(
        this._app.layers.added.addEventListener(resetHandler),
      );
    } else {
      setActiveMap(this._app.maps.activeMap);
      this.state = getStateFromLayer(this._layer);
      this._setLayerExtentAction();
      this.setPropertiesFromObject(this._layer);

      this._listeners.push(
        this._app.layers.removed.addEventListener(resetHandler),
        this._app.layers.added.addEventListener(resetHandler),
        this._layer.stateChanged.addEventListener(() => {
          this.state = getStateFromLayer(this._layer);
        }),
        this._app.maps.mapActivated.addEventListener(setActiveMap),
        () => {
          supportedLayersListener();
        },
      );
    }
  }

  async clicked(): Promise<void> {
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

  toJSON(): LayerContentTreeItemOptions {
    const config = super.toJSON() as LayerContentTreeItemOptions;
    config.layerName = this._layerName;
    if (this._showWhenNotSupported) {
      config.showWhenNotSupported = this._showWhenNotSupported;
    }
    return config;
  }

  destroy(): void {
    super.destroy();
    this._clearListeners();
  }
}

export default LayerContentTreeItem;
contentTreeClassRegistry.registerClass(
  LayerContentTreeItem.className,
  LayerContentTreeItem,
);
