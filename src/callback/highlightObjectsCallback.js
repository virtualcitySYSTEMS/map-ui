import { FeatureLayer, VectorStyleItem } from '@vcmap/core';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import('@vcmap/core').VectorStyleItemOptions} VectorStyleItemOptions
 */

/**
 * @typedef {import('@vcmap/ui').VcsCallbackOptions & {
 *   layerName: string;
 *   toHighlight: Record<string, VectorStyleItemOptions>;
 * }} HighlightObjectsCallbackOptions
 */

/**
 * A callback to highlight objects of FeatureLayers.
 */
export default class HighlightObjectsCallback extends VcsCallback {
  static get className() {
    return 'HighlightObjectsCallback';
  }

  /** @type {string} */
  _layerName;

  /** @type {Record<string, VectorStyleItemOptions>} */
  _toHighlight;

  /**
   * @param {HighlightObjectsCallbackOptions} options
   * @param {import('@vcmap/ui').VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);

    this._layerName = options.layerName;
    this._toHighlight = options.toHighlight;
  }

  callback() {
    /** @type {import('@vcmap/ui').VcsUiApp} */
    const app = this._app;
    const layer = app.layers.getByKey(this._layerName);

    if (layer instanceof FeatureLayer) {
      /** @type {Record<string, VectorStyleItem>} */
      const toHighlightInstances = {};
      Object.keys(this._toHighlight).forEach((key) => {
        toHighlightInstances[key] = new VectorStyleItem(this._toHighlight[key]);
      });
      layer.featureVisibility.highlight(toHighlightInstances);
    }
  }

  /** @returns {HighlightObjectsCallbackOptions} */
  toJSON() {
    return {
      ...super.toJSON(),
      layerName: this._layerName,
      toHighlight: structuredClone(this._toHighlight),
    };
  }
}

callbackClassRegistry.registerClass(
  HighlightObjectsCallback.className,
  HighlightObjectsCallback,
);
