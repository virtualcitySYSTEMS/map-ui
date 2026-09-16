import {
  Extent,
  type Layer,
  type VcsMap,
  type WMSLayer,
  getInitForUrl,
  markVolatile,
} from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import { type Ref, ref } from 'vue';
import { parseBoolean } from '@vcsuite/parsers';
import { is } from '@vcsuite/check';
import deepEqual from 'fast-deep-equal';
import type { Extent as OLExtent } from 'ol/extent.js';
import WMSCapabilities from 'ol/format/WMSCapabilities.js';
import type { VcsTreeNodeItem } from '../components/lists/treeHelper.ts';
import type VcsUiApp from '../vcsUiApp.js';
import { StateActionState } from '../actions/stateRefAction.js';
import {
  type ContentTreeItemOptions,
  type TreeViewItem,
  contentTreeClassRegistry,
} from './contentTreeItem.js';
import WmsChildContentTreeItem from './wmsChildContentTreeItem.js';
import VcsObjectContentTreeItem from './vcsObjectContentTreeItem.js';
import {
  type IconLegendRow,
  type ImageLegendItem,
  type StyleLegendItem,
  legendSymbol,
} from '../legend/legendHelper.js';

/**
 * @param src The OnlineRessource property of the legend
 */
function parseLegend(
  src: string,
  width: number,
  title: string,
): StyleLegendItem | ImageLegendItem {
  if (width < 25) {
    const row: IconLegendRow = {
      type: 'IconLegendRow',
      title,
      image: { src },
    };
    return {
      type: 'StyleLegendItem',
      colNr: 1,
      rows: [row],
    };
  }
  return { type: 'ImageLegendItem', popoutBtn: true, src };
}

function parseSerializedCapabilities(
  capabilities: SerializedWMSCapabilities,
  className: string,
  layerName: string,
): WMSEntry[] {
  if (capabilities?.layers?.length > 0) {
    return capabilities.layers
      .filter((layer) => {
        if (!is(layer, { name: String })) {
          getLogger(className).warning(
            `Ignoring WMS Layer without name in layer ${layerName}`,
          );
          return false;
        }
        return true;
      })
      .map((layer) => {
        const styles: WMSStyleEntry[] =
          layer.styles
            ?.filter((s) => {
              if (!is(s, { name: String })) {
                getLogger(className).warning(
                  `Ignoring WMS Style without name in layer ${layerName}`,
                );
                return false;
              }
              return true;
            })
            .map((s) => ({
              name: s.name,
              title: s.title ?? s.name,
              legend:
                s.legend
                  ?.filter((l) => {
                    if (
                      !is(l, { url: String, width: Number, height: Number })
                    ) {
                      getLogger(className).warning(
                        `Ignoring invalid WMS Legend in style ${s.name} in layer ${layerName}`,
                      );
                      return false;
                    }
                    return true;
                  })
                  .map((l) => parseLegend(l.url, l.width, s.title || '')) || [],
            })) ?? [];

        const wmsEntry: WMSEntry = {
          name: layer.name,
          active: ref(false),
          activeStyle: ref(''),
        };
        if (layer.title) {
          wmsEntry.title = layer.title;
        }
        if (layer.extent) {
          wmsEntry.extent = new Extent({ coordinates: layer.extent });
        }
        if (styles && styles.length > 0) {
          wmsEntry.styles = styles;
        }
        return wmsEntry;
      });
  } else {
    return [];
  }
}

async function getWMSEntries(
  rawUrl: string,
  parameters: Record<string, string>,
  headers?: Record<string, string>,
): Promise<WMSEntry[]> {
  const url = new URL(rawUrl);
  const excludedParameters = [
    'LAYERS',
    'TRANSPARENT',
    'FORMAT',
    'STYLE',
    'STYLES',
  ];
  Object.entries(parameters).forEach(([key, value]) => {
    if (!excludedParameters.includes(key)) {
      url.searchParams.set(key, value);
    }
  });
  url.searchParams.set('SERVICE', 'WMS');
  url.searchParams.set('REQUEST', 'GetCapabilities');

  const init = getInitForUrl(url.toString(), headers);
  const res = await fetch(url.toString(), init);
  if (!res.ok) {
    throw new Error(`Failed to fetch capabilities: ${res.statusText}`);
  }
  const xml = await res.text();
  const capabilities = new WMSCapabilities().read(xml) as {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Capability: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Layer: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Layer: Array<{
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Name: string;
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Title: string;
          // eslint-disable-next-line @typescript-eslint/naming-convention
          EX_GeographicBoundingBox: number[];
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Style?: Array<{
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Name: string;
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Title: string;
            // eslint-disable-next-line @typescript-eslint/naming-convention
            LegendURL?: Array<{
              // eslint-disable-next-line @typescript-eslint/naming-convention
              OnlineResource: string;
              size: [number, number];
            }>;
          }>;
        }>;
      };
    };
  };

  const wmsEntries = capabilities.Capability.Layer.Layer
    // layer without Name are not requestable, they are just a Group.
    .filter((layer) => layer.Name)
    .map((layer) => {
      const styles =
        layer.Style?.map((style) => ({
          name: style.Name,
          title: style.Title,
          legend:
            style.LegendURL?.filter((legend) => legend.OnlineResource).map(
              (legend) =>
                parseLegend(legend.OnlineResource, legend.size[0], layer.Title),
            ) ?? [],
        })) ?? [];
      return {
        name: layer.Name,
        active: ref(false),
        activeStyle: ref(''),
        title: layer.Title,
        extent: new Extent({ coordinates: layer.EX_GeographicBoundingBox }),
        styles,
      };
    });
  return wmsEntries;
}

function createWMSChildContentTreeItem(
  app: VcsUiApp,
  wmsEntry: WMSEntry,
  parentName: string,
  hideStyleSelector: boolean,
): WmsChildContentTreeItem {
  const childItem = new WmsChildContentTreeItem(
    {
      name: `${parentName}.${wmsEntry.name.replaceAll('.', '_')}`,
      wmsEntry,
      title: wmsEntry.title,
      hideStyleSelector,
    },
    app,
  );
  markVolatile(childItem);
  return childItem;
}

type WMSGroupContentTreeItemOptions = ContentTreeItemOptions & {
  /** The name of the WMSLayer to show the children of. */
  layerName: string;
  /** optional flag to load the capabilities on startup, will be loaded on click otherwise. Leads to an inherent "initOpen" flag  if not true. Defaults to false. */
  loadOnStartup?: boolean;
  /** optional flag to show the item even if it is not supported by the activeMap. Defaults to false. */
  showWhenNotSupported?: boolean;
  /** Whether the WMSlayers are mutually exclusive. Defaults to false. */
  setWMSLayersExclusive?: boolean;
  /** Whether the layer style can be selected. Will add a StyleSelector action to compatible items if the Layer has more than one style. Defaults to false. */
  hideStyleSelector?: boolean;
  /** The list of layers to be shown, other available layers will not be shown. */
  allowedWMSLayers?: string[];
};

type WMSStyleEntry = {
  name: string;
  title: string;
  legend: (StyleLegendItem | ImageLegendItem)[];
};

export type WMSEntry = {
  name: string;
  title?: string;
  active: Ref<boolean>;
  activeStyle: Ref<string>;
  extent?: Extent;
  styles?: Array<WMSStyleEntry>;
};

type SerializedWMSLegend = {
  url: string;
  width: number;
  height: number;
};

type SerializedWMSStyle = {
  name: string;
  title?: string;
  legend?: SerializedWMSLegend[];
};

type SerializedWMSLayer = {
  name: string;
  title?: string;
  /** layer extent, in WGS84 coordinates */
  extent?: OLExtent;
  styles?: SerializedWMSStyle[];
};

/**
 * The serialized form of WMS Capabilities are used in the configuration to avoid fetching the capabilities on every startup.
 */
type SerializedWMSCapabilities = {
  layers: Array<SerializedWMSLayer>;
};

/**
 * A WMSGroupItem, will take over a WMSLayer and request the Capabilities of the layer to show all available
 * layers as child Items. The WMSGroupItem will also set the legend on the Layer based on the Capabilities,
 * if the Layer does not have a legend configured.
 */
class WMSGroupContentTreeItem extends VcsObjectContentTreeItem {
  static get className(): string {
    return 'WMSGroupContentTreeItem';
  }

  private _layerName: string;
  private _loadOnStartup: boolean;
  private _showWhenNotSupported: boolean;
  private _setWMSLayersExclusive: boolean;
  private _hideStyleSelector: boolean;
  private _allowedWMSLayers?: string[];
  private _availableWMSEntries: WMSEntry[] = [];
  /** references the current ChildItems, this WMSGroupContentTreeItem manages */
  private _childItems: WmsChildContentTreeItem[] = [];
  private _listeners: Array<() => void> = [];
  /** this flag is set to true, if the legend is already set, so we do not need to manage the legend */
  private _legendSet = false;
  /** pause the stateChangedListener, if the state is set from the Layer to the WMSGroupContentTreeItem */
  private _pauseStateChangedListener = false;
  private _childrenLoaded = false;

  constructor(options: WMSGroupContentTreeItemOptions, app: VcsUiApp) {
    super({ initOpen: !options.loadOnStartup, ...options }, app);

    this._layerName = options.layerName;
    this._loadOnStartup = parseBoolean(options.loadOnStartup, false);
    this._showWhenNotSupported = parseBoolean(
      options.showWhenNotSupported,
      false,
    );
    this._setWMSLayersExclusive = parseBoolean(
      options.setWMSLayersExclusive,
      false,
    );
    this._hideStyleSelector = parseBoolean(options.hideStyleSelector, false);

    // if WMSLayers should be handled exclusive, the item should handle like a NodeContentTreeItem.
    this.clickable = !this._setWMSLayersExclusive || !this._loadOnStartup;

    this.state =
      this._setWMSLayersExclusive || !this._loadOnStartup
        ? StateActionState.NONE
        : StateActionState.INACTIVE;

    this._allowedWMSLayers = options.allowedWMSLayers;

    this._setup().catch(() => {});
  }

  /**
   * readonly access, do not manipulate the entries directly.
   */
  get wmsEntries(): Array<WMSEntry> {
    return this._availableWMSEntries;
  }

  get disabled(): boolean {
    return super.disabled;
  }

  set disabled(disabled: boolean) {
    super.disabled = disabled;
    this._childItems.forEach((childItem) => {
      childItem.disabled = this.disabled;
    });
  }

  get visible(): boolean {
    return super.visible;
  }

  set visible(visible: boolean) {
    super.visible = visible;
    this._childItems.forEach((childItem) => {
      childItem.visible = this.visible;
    });
  }

  private get _layer(): WMSLayer & {
    [legendSymbol]?: (StyleLegendItem | ImageLegendItem)[];
  } {
    return this._app.layers.getByKey(this._layerName) as WMSLayer;
  }

  private _setState(): void {
    if (this._setWMSLayersExclusive) {
      this.state = StateActionState.NONE;
    } else {
      const activeLayers = this._availableWMSEntries.filter(
        (wmsEntry) => wmsEntry.active.value,
      );
      if (activeLayers.length === this._availableWMSEntries.length) {
        this.state = StateActionState.ACTIVE;
      } else if (activeLayers.length === 0) {
        this.state = StateActionState.INACTIVE;
      } else {
        this.state = StateActionState.INDETERMINATE;
      }
    }
  }

  /**
   * Sets the Legend on the Layer, based on the active WMSLayers and the active Styles.
   */
  private _setLegend(): void {
    if (!this._legendSet) {
      const legend = this._availableWMSEntries
        .filter((wmsEntry) => wmsEntry.active.value)
        .map((wmsEntry) => {
          const activeStyle = wmsEntry.activeStyle.value;
          if (activeStyle === '') {
            return wmsEntry.styles?.[0]?.legend;
          } else {
            return wmsEntry?.styles?.find((style) => style.name === activeStyle)
              ?.legend;
          }
        })
        .flat()
        .filter((l) => !!l);
      if (legend.length > 0) {
        this._layer[legendSymbol] = legend;
      } else {
        delete this._layer[legendSymbol];
      }
    }
    this._pauseStateChangedListener = true;
    this._layer.stateChanged.raiseEvent(this._layer.state); // triggers Legend update;
    this._pauseStateChangedListener = false;
  }

  /**
   * sets the State of to the underlying Layer
   */
  private async _setStateToLayer(): Promise<void> {
    this._setState();
    const layersOnLayer = this._layer.getLayers();
    const stylesOnLayer = this._layer.parameters.STYLES?.split(',') ?? [];
    const activeLayers = this._availableWMSEntries.filter(
      (wmsEntry) => wmsEntry.active.value,
    );
    const currentStyles = activeLayers.map(
      (wmsEntry) => wmsEntry.activeStyle.value,
    );
    const currentLayers = activeLayers.map((wmsEntry) => wmsEntry.name);
    this._pauseStateChangedListener = true;
    try {
      if (
        !deepEqual(currentLayers, layersOnLayer) ||
        !deepEqual(stylesOnLayer, currentStyles)
      ) {
        this._layer.parameters.STYLES = currentStyles.join(',');
        await this._layer.setLayers(currentLayers);
      }
      if (currentLayers.length > 0 && !this._layer.active) {
        await this._layer.activate();
      } else if (currentLayers.length === 0) {
        this._layer.deactivate();
      }
    } catch (e) {
      getLogger(this.className).error(
        `An error occured while setting the state to the Layer: $(this._layerName)`,
        e,
      );
    }
    this._pauseStateChangedListener = false;
    this._setLegend();
  }

  /**
   * this reacts to clickEvents from the ChildItem, and sets internal State correspondingly,
   * and also sets the State to the Layer and the children.
   */
  private _handleChildClickedEvent(item: WmsChildContentTreeItem): void {
    if (item.wmsEntry.active.value) {
      item.wmsEntry.active.value = false;
    } else {
      if (this._setWMSLayersExclusive) {
        this._availableWMSEntries.forEach((wmsEntry) => {
          wmsEntry.active.value = false;
        });
      }
      item.wmsEntry.active.value = true;
    }
    this._setStateToLayer().catch(() => {});
  }

  private _handleStyleSelectedEvent(
    item: WmsChildContentTreeItem,
    style: string,
  ): void {
    item.wmsEntry.activeStyle.value = style;
    this._setStateToLayer().catch(() => {});
  }

  private _clear(): void {
    this._childItems.forEach((childItem) => {
      this._app.contentTree.remove(childItem);
      childItem.destroy();
    });
    this._childItems = [];
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
    this._availableWMSEntries = [];
    this._legendSet = false;
    this._childrenLoaded = false;

    // Reset clickable state based on initial configuration
    this.clickable = !this._setWMSLayersExclusive || !this._loadOnStartup;
  }

  /**
   * syncs the State from the Layer to the WMSGroupContentTreeItem
   */
  private _setStateFromLayer(): void {
    if (this._layer) {
      if (this._layer.active) {
        const activeWMSLayers = this._layer.getLayers();
        if (this._setWMSLayersExclusive) {
          this._availableWMSEntries.forEach((wmsEntry) => {
            wmsEntry.active.value = false;
            if (activeWMSLayers?.[0] === wmsEntry.name) {
              wmsEntry.active.value = true;
            }
          });
        } else {
          this._availableWMSEntries.forEach((wmsEntry) => {
            wmsEntry.active.value = activeWMSLayers.includes(wmsEntry.name);
          });
        }
      } else {
        this._availableWMSEntries.forEach((wmsEntry) => {
          wmsEntry.active.value = false;
        });
      }
      if (this._layer.parameters.STYLES) {
        const activeWMSLayers = this._layer.getLayers();
        const activeStyles = this._layer.parameters.STYLES.split(',');
        if (activeWMSLayers.length === activeStyles.length) {
          this._availableWMSEntries.forEach((wmsEntry) => {
            if (activeWMSLayers.includes(wmsEntry.name)) {
              const styleIndex = activeWMSLayers.indexOf(wmsEntry.name);
              wmsEntry.activeStyle.value = activeStyles[styleIndex];
            }
          });
        }
      }
    }
  }

  private _determineSupport(): void {
    const isSupported = this._layer?.isSupported(this._app.maps.activeMap!);
    this.visible = isSupported || this._showWhenNotSupported;
    if (this._showWhenNotSupported) {
      this.disabled = !isSupported;
    }
  }

  /**
   * Loads WMS entries and creates child items
   */
  private async _loadWMSChildren(): Promise<void> {
    if (this._childrenLoaded || !this._layer) {
      return;
    }

    this.state = StateActionState.LOADING;
    this.clickable = !this._setWMSLayersExclusive;

    try {
      let availableWMSEntries: WMSEntry[] = [];
      if (this._layer.properties.capabilities) {
        availableWMSEntries = parseSerializedCapabilities(
          this._layer.properties.capabilities as SerializedWMSCapabilities,
          this.className,
          this._layerName,
        );
      } else {
        availableWMSEntries = await getWMSEntries(
          this._layer.url,
          this._layer.parameters,
          this._layer.headers,
        );
      }
      // check if the layer still exists, it can happen that the layer was removed while fetching the capabilities.
      if (!this._layer) {
        return;
      }
      this._availableWMSEntries = availableWMSEntries.filter((wmsEntry) => {
        return this._allowedWMSLayers
          ? this._allowedWMSLayers.includes(wmsEntry.name)
          : true;
      });
      const childItems = this._availableWMSEntries.map((wmsEntry) =>
        createWMSChildContentTreeItem(
          this._app,
          wmsEntry,
          this.name,
          this._hideStyleSelector,
        ),
      );
      childItems.forEach((childItem) => {
        this._app.contentTree.add(childItem);
        childItem.disabled = this.disabled;
        this._listeners.push(
          childItem.clickedEvent.addEventListener(() => {
            this._handleChildClickedEvent(childItem);
          }),
          childItem.styleSelected.addEventListener((style) => {
            this._handleStyleSelectedEvent(childItem, style);
          }),
        );
      });
      this._childItems = childItems;
      // check if we do have a legend already configured, if yes we set a flag, that we do not need to set the legend.
      if (this._layer.properties.legend) {
        this._legendSet = true;
      }
      // we need to get the Initial State from the Layer, to set the correct State to the children.
      this._setStateFromLayer();
      // the layer State maybe incomplete or does not fit to the wmsGroupContentTreeItem, so we need to set the State to the Layer.
      this._setState();
      this._setLegend();
      this._childrenLoaded = true;

      // Update clickable state after children are loaded
      if (!this._setWMSLayersExclusive) {
        this.clickable = true;
      }
    } catch (e) {
      // if the layer is not there it has been removed while fetching the capabilities.
      if (this._layer) {
        this._layer.deactivate();
        this.visible = false;
      }
      getLogger(this.className).error(
        `An error occured while fetching the ${this._layerName} capabilities:`,
        e,
      );
    }
  }

  private async _setup(): Promise<void> {
    this._clear();
    /**
     * Called when a layer is added or removed to reset the item if needed
     */
    const resetHandler = (layer: Layer): void => {
      if (layer.name === this._layerName) {
        this._setup().catch(() => {});
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
      this.setPropertiesFromObject(this._layer);
      setActiveMap(this._app.maps.activeMap);

      this._listeners.push(
        this._app.layers.removed.addEventListener(resetHandler),
        this._app.layers.added.addEventListener(resetHandler),
        this._layer.stateChanged.addEventListener(() => {
          if (!this._pauseStateChangedListener) {
            this._setStateFromLayer();
            this._setState();
            this._setLegend();
          }
        }),
        this._app.maps.mapActivated.addEventListener(setActiveMap),
        () => {
          supportedLayersListener();
        },
      );

      if (this._loadOnStartup) {
        await this._loadWMSChildren();
      }
    }
  }

  async clicked(): Promise<void> {
    await super.clicked();
    if (!this._childrenLoaded) {
      await this._loadWMSChildren();
      return;
    }
    if (this.state === StateActionState.NONE || this._setWMSLayersExclusive) {
      return;
    }
    const activeLayers = this._availableWMSEntries.filter(
      (wmsEntry) => wmsEntry.active.value,
    );
    const newState = activeLayers.length !== this._availableWMSEntries.length;
    this._availableWMSEntries.forEach((wmsEntry) => {
      wmsEntry.active.value = newState;
    });
    await this._setStateToLayer();
  }

  /**
   * Returns a readonly TreeViewItem used for rendering the current item.
   */
  getTreeViewItem(): TreeViewItem {
    const item = super.getTreeViewItem();
    (item as VcsTreeNodeItem).forceNodeDisplay = !this._loadOnStartup;
    return item;
  }
  /**
   * @returns {WMSGroupContentTreeItemOptions}
   */
  toJSON(): WMSGroupContentTreeItemOptions {
    const config = super.toJSON() as WMSGroupContentTreeItemOptions;
    config.layerName = this._layerName;
    const defaultInitOpen = !this._loadOnStartup;
    if (this.initOpen !== defaultInitOpen) {
      config.initOpen = this.initOpen;
    }
    if (this._loadOnStartup) {
      config.loadOnStartup = this._loadOnStartup;
    }
    if (this._showWhenNotSupported) {
      config.showWhenNotSupported = this._showWhenNotSupported;
    }
    if (this._setWMSLayersExclusive) {
      config.setWMSLayersExclusive = this._setWMSLayersExclusive;
    }
    if (this._hideStyleSelector) {
      config.hideStyleSelector = this._hideStyleSelector;
    }
    if (this._allowedWMSLayers && this._allowedWMSLayers.length > 0) {
      config.allowedWMSLayers = this._allowedWMSLayers;
    }
    return config;
  }

  destroy(): void {
    super.destroy();
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }
}

export default WMSGroupContentTreeItem;
contentTreeClassRegistry.registerClass(
  WMSGroupContentTreeItem.className,
  WMSGroupContentTreeItem,
);
