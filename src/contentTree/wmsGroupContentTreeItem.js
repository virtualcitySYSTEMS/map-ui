import { markVolatile } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import { ref } from 'vue';
import { parseBoolean } from '@vcsuite/parsers';
import deepEqual from 'fast-deep-equal';
import WMSCapabilities from 'ol/format/WMSCapabilities';
import { StateActionState } from '../actions/stateRefAction.js';
import { contentTreeClassRegistry } from './contentTreeItem.js';
import WmsChildContentTreeItem from './wmsChildContentTreeItem.js';
import VcsObjectContentTreeItem from './vcsObjectContentTreeItem.js';

/**
 * @param {string} rawUrl
 * @param {Record<string, string>} parameters
 * @returns {Promise<Array<WMSEntry>>} The fetched capabilities.
 */
async function getWMSEntries(rawUrl, parameters) {
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

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch capabilities: ${res.statusText}`);
  }
  const xml = await res.text();
  const { Capability } = new WMSCapabilities().read(xml);
  const wmsEntries = Capability.Layer.Layer
    // layer without Name are not requestable, they are just a Group.
    .filter((layer) => layer.Name)
    .map((layer) => {
      const styles =
        layer.Style?.map((style) => {
          return {
            name: style.Name,
            title: style.Title,
            legend: style.LegendURL?.filter(
              (legend) => legend.OnlineResource,
            ).map((legend) => {
              const src = legend.OnlineResource;
              if (legend.size[0] < 25) {
                return {
                  type: 'StyleLegendItem',
                  colNr: 1,
                  rows: [
                    {
                      type: 'IconLegendRow',
                      title: layer.Title,
                      image: { src },
                    },
                  ],
                };
              }
              return {
                type: 'ImageLegendItem',
                src,
                popoutBtn: true,
              };
            }),
          };
        }) ?? [];
      return {
        name: layer.Name,
        active: ref(false),
        activeStyle: ref(''),
        title: layer.Title,
        extent: layer.EX_GeographicBoundingBox,
        styles,
      };
    });
  return wmsEntries;
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @param {WMSEntry} wmsEntry
 * @param {string} parentName
 * @param {boolean} showStyleSelector
 * @returns {WmsChildContentTreeItem}
 */
function createWMSChildContentTreeItem(
  app,
  wmsEntry,
  parentName,
  showStyleSelector,
) {
  const childItem = new WmsChildContentTreeItem(
    {
      name: `${parentName}.${wmsEntry.name.replaceAll('.', '_')}`,
      wmsEntry,
      title: wmsEntry.title,
      showStyleSelector,
    },
    app,
  );
  markVolatile(childItem);
  return childItem;
}

/**
 * @typedef {import('./contentTreeItem.js').ContentTreeItemOptions &
 * { layerName: string, showWhenNotSupported?: boolean, exclusiveLayers?:boolean, editableStyle?:boolean, allowedWMSLayers?:string[]}} WMSGroupContentTreeItemOptions
 * @property {boolean} showWhenNotSupported - optional flag to show the item even if it is not supported by the activeMap.
 * @property {string} layerName - The name of the WMSLayer to show the children of.
 * @property {boolean} [setWMSLayersExclusive=false] - Whether the WMSlayers are mutually exclusive.
 * @property {boolean} [showStyleSelector=true] - Whether the layer style can be selected. Will add a StyleSelector action to compatible items if the Layer has more than one style.
 * @property {string[]} allowedWMSLayers - The list of layers to be shown, other available layers will not be shown.
 */

/**
 * @typedef {Object} WMSStyleEntry
 * @property {string} name
 * @property {string} title
 * @property {import("../legend/legendHelper.js").LegendItem} legend
 */

/**
 * @typedef {Object} WMSEntry
 * @property {string} name
 * @property {import("vue").Ref<boolean>} active
 * @property {import("vue").Ref<string>} activeStyle
 * @property {string} title
 * @property {import("@vcmap/core").Extent} extent
 * @property {Array<WMSStyleEntry>} styles
 */

/**
 * A WMSGroupItem, will take over a WMSLayer and request the Capabilities of the layer to show all available
 * layers as child Items. The WMSGroupItem will also set the legend on the Layer based on the Capabilities,
 * if the Layer does not have a legend configured.
 * @extends {VcsObjectContentTreeItem<import("./vcsObjectContentTreeItem.js").VcsObjectContentTreeItemProperties>}
 * @class
 */
class WMSGroupContentTreeItem extends VcsObjectContentTreeItem {
  static get className() {
    return 'WMSGroupContentTreeItem';
  }

  /**
   * @param {WMSGroupContentTreeItemOptions} options
   * @param {import("../vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);

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
     * @type {boolean}
     * @private
     */
    this._setWMSLayersExclusive = parseBoolean(
      options.setWMSLayersExclusive,
      false,
    );
    // if WMSLayers should be handled exclusive, the item should handle like a NodeContentTreeItem.
    this.clickable = !this._setWMSLayersExclusive;

    /**
     * @type {boolean}
     * @private
     */
    this._showStyleSelector = parseBoolean(options.showStyleSelector, true);

    this.state = this._setWMSLayersExclusive
      ? StateActionState.NONE
      : StateActionState.INACTIVE;

    /**
     * @type {boolean}
     * @private
     */
    this._invalid = false;

    /**
     * The only allowed layers.
     * @type {Array<string>|undefined}
     * @private
     */
    this._allowedWMSLayers = options.allowedWMSLayers;

    /**
     * @type {Array<WMSEntry>}
     * @private
     */
    this._availableWMSEntries = [];

    /**
     * references the current ChildItems, this WMSGroupContentTreeItem manages
     * @type {Array<WmsChildContentTreeItem>}
     * @private
     */
    this._childItems = [];

    /**
     * @type {Array<Function>}
     * @private
     */
    this._listeners = [];

    /**
     * this flag is set to true, if the legend is already set, so we do not need to manage the legend
     * @type {boolean}
     * @private
     */
    this._legendSet = false;

    /**
     * pause the stateChangedListener, if the state is set from the Layer to the WMSGroupContentTreeItem
     * @type {boolean}
     * @private
     */
    this._pauseStateChangedListener = false;

    this._setup();
  }

  /**
   * readonly access, do not manipulate the entries directly.
   * @type {Array<WMSEntry>}
   */
  get wmsEntries() {
    return this._availableWMSEntries;
  }

  /**
   * @type {boolean}
   */
  get disabled() {
    return super.disabled;
  }

  /**
   * @param {boolean} disabled
   */
  set disabled(disabled) {
    super.disabled = disabled;
    this._childItems.forEach((childItem) => {
      childItem.disabled = this.disabled;
    });
  }

  /**
   * @type {boolean}
   */
  get visible() {
    return super.visible;
  }

  /**
   * @param {boolean} visible
   */
  set visible(visible) {
    super.visible = visible;
    this._childItems.forEach((childItem) => {
      childItem.visible = this.visible;
    });
  }

  /**
   * @type {import("@vcmap/core").WMSLayer|undefined}
   * @private
   */
  get _layer() {
    return this._app.layers.getByKey(this._layerName);
  }

  _setState() {
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
   * @private
   */
  _setLegend() {
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
        .filter((l) => l);
      if (legend.length > 0) {
        this._layer.properties.legend = legend;
      } else {
        this._layer.properties.legend = undefined;
      }
    }
    this._pauseStateChangedListener = true;
    this._layer.stateChanged.raiseEvent(this._layer.state); // triggers Legend update;
    this._pauseStateChangedListener = false;
  }

  /**
   * sets the State of to the underlying Layer
   * @private
   */
  async _setStateToLayer() {
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
   * @param {WmsChildContentTreeItem} item
   */
  _handleChildClickedEvent(item) {
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
    this._setStateToLayer();
  }

  /**
   * @param {WmsChildContentTreeItem} item
   * @param {string} style
   * @private
   */
  _handleStyleSelectedEvent(item, style) {
    item.wmsEntry.activeStyle.value = style;
    this._setStateToLayer();
  }

  /**
   * @private
   */
  _clear() {
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
  }

  /**
   * syncs the State from the Layer to the WMSGroupContentTreeItem
   * @private
   */
  _setStateFromLayer() {
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

  /**
   * @returns {Promise<void>}
   * @private
   */
  async _setup() {
    this._clear();
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
      this.state = StateActionState.LOADING;
      this.setPropertiesFromObject(this._layer);

      this._listeners.push(
        this._app.layers.removed.addEventListener(resetHandler),
      );
      this._listeners.push(
        this._app.layers.added.addEventListener(resetHandler),
      );
      this._listeners.push(
        this._layer.stateChanged.addEventListener(() => {
          if (!this._pauseStateChangedListener) {
            this._setStateFromLayer();
            this._setState();
            this._setLegend();
          }
        }),
      );
      this._listeners.push(
        this._app.maps.mapActivated.addEventListener(() => {
          isSupported = this._layer.isSupported(this._app.maps.activeMap);
          this.visible =
            (isSupported || this._showWhenNotSupported) && !this._invalid;
          if (this._showWhenNotSupported) {
            this.disabled = !isSupported;
          }
        }),
      );
      try {
        const availableWMSEntries = await getWMSEntries(
          this._layer.url,
          this._layer.parameters,
        );
        this._availableWMSEntries = availableWMSEntries.filter((wmsEntry) => {
          return this._allowedWMSLayers
            ? this._allowedWMSLayers.includes(wmsEntry.name)
            : true;
        });
        const childItems = this._availableWMSEntries.map((wmsEntry) => {
          return createWMSChildContentTreeItem(
            this._app,
            wmsEntry,
            this.name,
            this._showStyleSelector,
          );
        });
        childItems.forEach((childItem) => {
          this._app.contentTree.add(childItem);
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
      } catch (e) {
        this._layer.deactivate();
        this.visible = false;
        this._invalid = true;
        getLogger(this.className).error(
          `An error occured while fetching the ${this._layerName} capabilities:`,
          e,
        );
      }
    }
  }

  async clicked() {
    await super.clicked();
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
   * @returns {WMSGroupContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.layerName = this._layerName;
    if (this._showWhenNotSupported) {
      config.showWhenNotSupported = this._showWhenNotSupported;
    }
    if (this._setWMSLayersExclusive) {
      config.setWMSLayersExclusive = this._setWMSLayersExclusive;
    }
    if (!this._showStyleSelector) {
      config.showStyleSelector = this._showStyleSelector;
    }
    if (this._allowedWMSLayers?.length > 0) {
      config.allowedWMSLayers = this._allowedWMSLayers;
    }
    return config;
  }

  destroy() {
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
