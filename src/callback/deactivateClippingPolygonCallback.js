import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import("./vcsCallback.js").VcsCallbackOptions & { names: string[] }} DeactivateClippingPolygonOptions
 * @property {string[]} names - names of the ClippingPolygonObjects to deactivate
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class DeactivateClippingPolygonCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'DeactivateClippingPolygonCallback';
  }

  /**
   * @param {DeactivateClippingPolygonOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {string[]}
     * @private
     */
    this._names = options.names;
  }

  callback() {
    this._names
      .map((n) => this._app.clippingPolygons.getByKey(n))
      .filter((l) => l)
      .forEach((l) => l.deactivate());
  }

  /**
   * @returns {DeactivateClippingPolygonOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.names = this._names.slice();
    return config;
  }
}

export default DeactivateClippingPolygonCallback;
callbackClassRegistry.registerClass(
  DeactivateClippingPolygonCallback.className,
  DeactivateClippingPolygonCallback,
);
