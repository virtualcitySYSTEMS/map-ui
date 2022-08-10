import { getShapeFromOptions } from '@vcmap/core';
import Vue, { reactive } from 'vue';

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
 * @typedef {LegendItem} ImageLegendItem
 * @property {boolean} [popoutBtn=false] - show a button in legend title to open legend in new tab
 * @property {string} src - the source url. Can be an i18n string.
 * @property {string} [tooltip] - Optional further explanation of the legend
 */

/**
 * @typedef {LegendItem} IframeLegendItem
 * @property {boolean} [popoutBtn=false] - show a button in legend title to open legend in new tab
 * @property {string} src - the source url. Can be an i18n string.
 */


/**
 * @typedef {LegendItem} StyleLegendItem
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
 * @typedef {StyleLegendRow} StrokeLegendRow
 * @property {import("ol/style/Stroke").Options} stroke
 */

/**
 * @typedef {StyleLegendRow} FillLegendRow
 * @property {import("ol/style/Fill").Options} fill
 * @property {import("ol/style/Stroke").Options} [stroke]
 */

/**
 * @typedef {StyleLegendRow} CircleLegendRow
 * @property {import("ol/style/Circle").Options} image
 */

/**
 * @typedef {StyleLegendRow} IconLegendRow
 * @property {import("ol/style/Icon").Options} image
 */

/**
 * @typedef {StyleLegendRow} RegularShapeLegendRow
 * @property {import("ol/style/RegularShape").Options} image
 */

/**
 * @typedef {StyleLegendRow} TextLegendRow
 * @property {import("ol/style/Text").Options} text
 * @property {string} [label='Text']
 */

/**
 * @type {import("ol/style/Image").Options} image
 * @return {string}
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
 * @property {string} title - layer or entry name
 * @property {Array<LegendItem>} legend - legend properties
 * @property {Array<VcsAction>} actions - popout actions
 */

/**
 * creates a LegendEntry with title, options and optionally popout action to the entries array
 * @param {string} title
 * @param {Array<LegendItem>} legend
 * @returns {LegendEntry}
 */
export function createLayerLegendEntry(title, legend) {
  const actions = [];
  legend.forEach((item) => {
    // XXX only one popout button allowed. Rethink if use case for multiple popout buttons comes up.
    if (item.src && item.popoutBtn && actions.length < 1) {
      actions.push({
        name: 'legendPopoutAction',
        icon: 'mdi-open-in-new',
        title: 'legend.openInNew',
        callback: () => window.open(item.src, '_blank'),
      });
    }
  });
  return { title, legend, actions };
}

/**
 *
 * @param {VcsUiApp} app
 * @returns {{entries: import("vue").Reactive<{string,LegendEntry}>, destroy: (function():void)}}
 */
export function getLegendEntries(app) {
  /**
   * @type {import("vue").Reactive<{string,LegendEntry}>}
   */
  const entries = reactive({});
  /**
   * @type {Object<string,function():void>}
   */
  const styleChangedListener = {};

  /**
   * @param {import("@vcmap/core").Layer} layer
   */
  function removeEntryForLayer(layer) {
    const key = layer.name;
    Vue.delete(entries, key); // XXX Vue.delete can be removed on Vue3
    if (styleChangedListener[key]) {
      styleChangedListener[key]();
      delete styleChangedListener[key];
    }
  }

  /**
   * adds or removes a LegendEntry on layer state changes and layer style changes
   * adds a styleChangedListener for all layers changing its state
   * @param {import("@vcmap/core").Layer} layer
   */
  function syncLayerLegendEntries(layer) {
    removeEntryForLayer(layer);
    if (layer.active) {
      const key = layer.name;
      const title = layer.properties.title || layer.name;
      const legend = layer.style?.properties?.legend ?? layer.properties?.legend;
      if (legend) {
        Vue.set(entries, key, createLayerLegendEntry(title, legend)); // XXX Vue.set can be removed on Vue3
      }
      if (layer.styleChanged) {
        styleChangedListener[layer.name] = layer.styleChanged.addEventListener(() => syncLayerLegendEntries(layer));
      }
    }
  }

  const destroyChangedListener = app.layers.stateChanged.addEventListener(syncLayerLegendEntries);
  const destroyRemovedListener = app.layers.removed.addEventListener(removeEntryForLayer);

  [...app.layers].forEach(syncLayerLegendEntries);

  const destroy = () => {
    destroyChangedListener();
    destroyRemovedListener();
    Object.values(styleChangedListener).forEach(cb => cb());
  };

  return { entries, destroy };
}