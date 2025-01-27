import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import("./vcsCallback.js").VcsCallbackOptions & { names: string[] }} ActivateClippingPolygonOptions
 * @property {string[]} names - names of the ClippingPolygonObjects to activate
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class ActivateClippingPolygonCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'ActivateClippingPolygonCallback';
  }

  /**
   * @param {ActivateClippingPolygonOptions} options
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
      .forEach((l) => l.activate());
  }

  /**
   * @returns {ActivateClippingPolygonOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.names = this._names.slice();
    return config;
  }
}

export default ActivateClippingPolygonCallback;
callbackClassRegistry.registerClass(
  ActivateClippingPolygonCallback.className,
  ActivateClippingPolygonCallback,
);
