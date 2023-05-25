import { FeatureLayer } from '@vcmap/core';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {VcsCallbackOptions} ApplyLayerStyleOptions
 * @property {string} styleName - name of the style
 * @property {string} layerName - name of the layer to apply the style
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class ApplyLayerStyleCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'ApplyLayerStyleCallback';
  }

  /**
   * @param {ApplyLayerStyleOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {string}
     * @private
     */
    this._styleName = options.styleName;
    /**
     * @type {string}
     * @private
     */
    this._layerName = options.layerName;
  }

  callback() {
    const style = this._app.styles.getByKey(this._styleName);
    const layer = this._app.layers.getByKey(this._layerName);
    if (style && layer && layer instanceof FeatureLayer) {
      layer.setStyle(style);
    }
  }

  /**
   * @returns {ApplyLayerStyleOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.styleName = this._styleName;
    config.layerName = this._layerName;
    return config;
  }
}

export default ApplyLayerStyleCallback;
callbackClassRegistry.registerClass(
  ApplyLayerStyleCallback.className,
  ApplyLayerStyleCallback,
);
