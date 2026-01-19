import { FeatureLayer } from '@vcmap/core';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import('@vcmap/ui').VcsCallbackOptions & {
 *   layerName: string;
 *   toUnHighlight: (string | number)[];
 * }} UnHighlightObjectsCallbackOptions
 */

/**
 * A callback to unhighlight previously highlighted objects of a FeatureLayer.
 */
export default class UnHighlightObjectsCallback extends VcsCallback {
  static get className() {
    return 'UnHighlightObjectsCallback';
  }

  /** @type {string} */
  _layerName;

  /** @type {(string | number)[]} */
  _toUnHighlight;

  /**
   * @param {UnHighlightObjectsCallbackOptions} options
   * @param {import('@vcmap/ui').VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);

    this._layerName = options.layerName;
    this._toUnHighlight = options.toUnHighlight;
  }

  callback() {
    /** @type {import('@vcmap/ui').VcsUiApp} */
    const app = this._app;
    const layer = app.layers.getByKey(this._layerName);

    if (layer instanceof FeatureLayer) {
      layer.featureVisibility.unHighlight(this._toUnHighlight);
    }
  }

  /** @returns {UnHighlightObjectsCallbackOptions} */
  toJSON() {
    return {
      ...super.toJSON(),
      layerName: this._layerName,
      toUnHighlight: [...this._toUnHighlight],
    };
  }
}

callbackClassRegistry.registerClass(
  UnHighlightObjectsCallback.className,
  UnHighlightObjectsCallback,
);
