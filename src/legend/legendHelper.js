import { getShapeFromOptions } from '@vcmap/core';
import { shallowRef } from 'vue';

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
 * @property {Array<import("../actions/actionHelper.js").VcsAction>} actions - popout actions
 */

/**
 * creates a LegendEntry with title, options and optionally popout action to the entries array
 * @param {string} key - layerName
 * @param {string} title
 * @param {Array<LegendItem>} legend
 * @returns {LegendEntry}
 */
export function createLayerLegendEntry(key, title, legend) {
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
  return { key, title, legend, actions, open: true };
}

/**
 *
 * @param {import("../vcsUiApp.js").default} app
 * @returns {{entries: import("vue").Ref<Array<LegendEntry>>, destroy: function():void }}
 */
export function getLegendEntries(app) {
  /**
   * @type {import("vue").Ref<Array<LegendEntry>>}>}
   */
  const entries = shallowRef([]);
  /**
   * @type {Object<string,function():void>}
   */
  const styleChangedListener = {};

  /**
   * @param {import("@vcmap/core").Layer} layer
   */
  function removeEntryForLayer(layer) {
    const layerName = layer.name;
    // reassign to trigger update
    entries.value = entries.value.filter(({ key }) => key !== layerName);
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
    if (layer.active) {
      const key = layer.name;
      const title = layer.properties.title || layer.name;
      const legend =
        layer.style?.properties?.legend ?? layer.properties?.legend;
      if (legend) {
        const legendEntry = createLayerLegendEntry(key, title, legend);
        // use spread since push won't trigger updates. Put new entries at the start
        entries.value = [legendEntry, ...entries.value];
      }
      if (layer.styleChanged) {
        styleChangedListener[layer.name] = layer.styleChanged.addEventListener(
          () => syncLayerLegendEntries(layer),
        );
      }
    }
  }

  const destroyChangedListener = app.layers.stateChanged.addEventListener(
    syncLayerLegendEntries,
  );
  const destroyRemovedListener =
    app.layers.removed.addEventListener(removeEntryForLayer);

  [...app.layers].forEach(syncLayerLegendEntries);

  const destroy = () => {
    destroyChangedListener();
    destroyRemovedListener();
    Object.values(styleChangedListener).forEach((cb) => cb());
  };

  return { entries, destroy };
}
