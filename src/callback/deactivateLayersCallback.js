import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {VcsCallbackOptions} DeactivateLayersOptions
 * @property {Array<string>} layerNames - layer names to deactivate
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class DeactivateLayersCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'DeactivateLayersCallback';
  }

  /**
   * @param {DeactivateLayersOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {Array<string>}
     * @private
     */
    this._layerNames = options.layerNames;
  }

  callback() {
    this._layerNames
      .map((n) => this._app.layers.getByKey(n))
      .filter((l) => l)
      .forEach((l) => l.deactivate());
  }

  /**
   * @returns {DeactivateLayersOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.layerNames = this._layerNames.slice();
    return config;
  }
}

export default DeactivateLayersCallback;
callbackClassRegistry.registerClass(
  DeactivateLayersCallback.className,
  DeactivateLayersCallback,
);
