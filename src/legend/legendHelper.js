import { getShapeFromOptions } from '@vcmap/core';
import { reactive } from 'vue';

/**
 * @enum {string}
 * @property {string} Image - an image
 * @property {string} IFRAME - an iframe
 * @property {string} Style - a parametric style element
 */
export const LegendType = {
  Image: 'ImageLegendItem',
  Iframe: 'IframeLegendItem',
  Style: 'StyleLegendItem',
};

/**
 * @enum {string}
 */
export const StyleRowType = {
  Stroke: 'StrokeLegendRow',
  Fill: 'FillLegendRow',
  Circle: 'CircleLegendRow',
  Icon: 'IconLegendRow',
  Shape: 'RegularShapeLegendRow',
  Text: 'TextLegendRow',
};

/**
 * @typedef {Object} LegendItem
 * @property {LegendType} type - determines rendering, specialised properties are type based.
 */

/**
 * @typedef {LegendItem & { popoutBtn?: boolean, src: string, tooltip?: string }} ImageLegendItem
 * @property {boolean} [popoutBtn=false] - show a button in legend title to open legend in new tab
 * @property {string} src - the source url. Can be an i18n string.
 * @property {string} [tooltip] - Optional further explanation of the legend
 */

/**
 * @typedef {LegendItem & { popoutBtn?: boolean, src: string }} IframeLegendItem
 * @property {boolean} [popoutBtn=false] - show a button in legend title to open legend in new tab
 * @property {string} src - the source url. Can be an i18n string.
 */

/**
 * @typedef {LegendItem & { colNr?: number, rows: StyleLegendRow[] }} StyleLegendItem
 * @property {number} [colNr=2] Number of columns. Valid values are 1 or 2. Per default 2.
 * @property {Array<StyleLegendRow>} rows - style definitions with description
 */

/**
 * @typedef {Object} StyleLegendRow
 * @property {StyleRowType} type - determines rendering of the row, specialised properties are type based.
 * @property {string} title - Description of the style. Can be an i18n string
 * @property {string} [tooltip] - Optional further explanation of the legend row
 */

/**
 * @typedef {StyleLegendRow & { stroke: import("ol/style/Stroke.js").Options }} StrokeLegendRow
 */

/**
 * @typedef {StyleLegendRow & {
 *   fill: import("ol/style/Fill.js").Options,
 *   stroke?: import("ol/style/Stroke.js").Options
 * }} FillLegendRow
 */

/**
 * @typedef {StyleLegendRow & { image: import("ol/style/Circle.js").Options }} CircleLegendRow
 */

/**
 * @typedef {StyleLegendRow & { image: import("ol/style/Icon.js").Options }} IconLegendRow
 */

/**
 * @typedef {StyleLegendRow & { image: import("ol/style/RegularShape.js").Options }} RegularShapeLegendRow
 */

/**
 * @typedef {StyleLegendRow & {
 *   text: import("ol/style/Text.js").Options,
 *   label?: string,
 * }} TextLegendRow
 * @property {import("ol/style/Text.js").Options} text
 * @property {string} [label='Text']
 */

/**
 * @param {import("ol/style/Image.js").Options} image
 * @returns {string}
 */
export function getImageSrcFromShape(image) {
  if (image.src) {
    return image.src;
  }
  const shape = getShapeFromOptions(image);
  const imageRep = shape.getImage(1);
  return imageRep.currentSrc || imageRep.toDataURL();
}

/**
 * @typedef {Object} LegendEntry
 * @property {string} key
 * @property {string} title - layer or entry name
 * @property {boolean} [open=true] - panel state of entry
 * @property {Array<LegendItem>} legend - legend properties
 */

/**
 *
 * @param {import("../vcsUiApp.js").default} app
 * @returns {{entries: import("vue").UnwrapRef<Array<LegendEntry>>, destroy: function():void }}
 */
export function getLegendEntries(app) {
  /**
   * @type {import("vue").UnwrapRef<Array<LegendEntry>>}>}
   */
  const entries = reactive([]);
  /**
   * @type {Object<string,function():void>}
   */
  const styleChangedListener = {};

  /**
   * @param {import("@vcmap/core").Layer} layer
   */
  function removeEntryForLayer(layer) {
    const layerName = layer.name;
    const entryIndex = entries.findIndex(({ key }) => key === layerName);
    if (entryIndex >= 0) {
      entries.splice(entryIndex, 1);
    }
    if (styleChangedListener[layerName]) {
      styleChangedListener[layerName]();
      delete styleChangedListener[layerName];
    }
  }

  /**
   * adds or removes a LegendEntry on layer state changes and layer style changes
   * adds a styleChangedListener for all layers changing its state
   * @param {import("@vcmap/core").Layer} layer
   */
  function syncLayerLegendEntries(layer) {
    removeEntryForLayer(layer);
    if (layer.active && layer.isSupported(app.maps.activeMap)) {
      const key = layer.name;
      const title = layer.properties.title || layer.name;
      const legend =
        layer.style?.properties?.legend ?? layer.properties?.legend;
      if (legend) {
        const legendEntry = { key, title, legend, open: true };
        entries.unshift(legendEntry);
      }
      if (layer.styleChanged) {
        styleChangedListener[layer.name] = layer.styleChanged.addEventListener(
          () => syncLayerLegendEntries(layer),
        );
      }
    }
  }

  /**
   * @param {import("@vcmap/core").VectorClusterGroup} group
   */
  function removeEntryForGroup(group) {
    const groupName = group.name;
    const entryIndex = entries.findIndex(({ key }) => key === groupName);
    if (entryIndex >= 0) {
      entries.splice(entryIndex, 1);
    }
  }

  /**
   * Handles addition or removal of VectorClusterGroups
   * @param {import("@vcmap/core").Layer[]} layers
   */
  function syncVectorClusterGroups(layers) {
    [...app.vectorClusterGroups].forEach(removeEntryForGroup);
    const vectorClusterGroups = layers
      .filter((layer) => layer.active && layer.isSupported)
      .map((layer) => layer.vectorClusterGroup);
    const uniqueVectorClusterGroups = [...new Set(vectorClusterGroups)];
    uniqueVectorClusterGroups.forEach((groupName) => {
      const group = app.vectorClusterGroups.getByKey(groupName);
      if (group?.properties?.legend) {
        const title = group.properties.title || group.name;
        const { legend } = group.properties;
        if (!entries.some(({ key }) => key === group.name)) {
          const legendEntry = { key: group.name, title, legend, open: true };
          entries.unshift(legendEntry);
        }
      }
    });
  }

  const destroyMapListener = app.maps.mapActivated.addEventListener(() => {
    [...app.layers].forEach(syncLayerLegendEntries);
    syncVectorClusterGroups([...app.layers]);
  });

  const destroyChangedListener = app.layers.stateChanged.addEventListener(
    (l) => {
      syncLayerLegendEntries(l);
      syncVectorClusterGroups([...app.layers]);
    },
  );
  const destroyRemovedListener = app.layers.removed.addEventListener((l) => {
    removeEntryForLayer(l);
    syncVectorClusterGroups([...app.layers]);
  });

  [...app.layers].forEach((l) => {
    syncLayerLegendEntries(l);
  });
  syncVectorClusterGroups([...app.layers]);

  const destroy = () => {
    destroyMapListener();
    destroyChangedListener();
    destroyRemovedListener();
    Object.values(styleChangedListener).forEach((cb) => cb());
  };

  return { entries, destroy };
}
