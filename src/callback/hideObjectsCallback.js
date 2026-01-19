import { FeatureLayer } from '@vcmap/core';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import('@vcmap/ui').VcsCallbackOptions & {
 *   layerName?: string;
 *   objectIds: string[];
 * }} HideObjectsCallbackOptions
 */

/**
 * A callback to hide objects with given ids in a specific layer or globally if no layer is given.
 */
export default class HideObjectsCallback extends VcsCallback {
  static get className() {
    return 'HideObjectsCallback';
  }

  /** @type {string | undefined} */
  _layerName;

  /** @type {string[]} */
  _objectIds;

  /**
   * @param {HideObjectsCallbackOptions} options
   * @param {import('@vcmap/ui').VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);

    this._layerName = options.layerName;
    this._objectIds = options.objectIds;
  }

  callback() {
    /** @type {import('@vcmap/ui').VcsUiApp} */
    const app = this._app;
    if (this._layerName) {
      const layer = app.layers.getByKey(this._layerName);
      if (layer instanceof FeatureLayer) {
        layer.featureVisibility.hideObjects(this._objectIds);
      }
    } else {
      app.layers.globalHider.hideObjects(this._objectIds);
    }
  }

  /** @returns {HideObjectsCallbackOptions} */
  toJSON() {
    return {
      ...super.toJSON(),
      layerName: this._layerName,
      objectIds: [...this._objectIds],
    };
  }
}

callbackClassRegistry.registerClass(
  HideObjectsCallback.className,
  HideObjectsCallback,
);
