import { FeatureLayer } from '@vcmap/core';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import('@vcmap/ui').VcsCallbackOptions & {
 *   layerName?: string;
 *   objectIds: string[];
 * }} ShowObjectsCallbackOptions
 */

/**
 * A callback to show objects that were previously hidden.
 */
export default class ShowObjectsCallback extends VcsCallback {
  static get className() {
    return 'ShowObjectsCallback';
  }

  /** @type {string | undefined} */
  _layerName;

  /** @type {string[]} */
  _objectIds;

  /**
   * @param {ShowObjectsCallbackOptions} options
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
        layer.featureVisibility.showObjects(this._objectIds);
      }
    } else {
      app.layers.globalHider.showObjects(this._objectIds);
    }
  }

  /** @returns {ShowObjectsCallbackOptions} */
  toJSON() {
    return {
      ...super.toJSON(),
      layerName: this._layerName,
      objectIds: [...this._objectIds],
    };
  }
}

callbackClassRegistry.registerClass(
  ShowObjectsCallback.className,
  ShowObjectsCallback,
);
