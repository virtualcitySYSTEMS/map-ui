import { getLogger } from '@vcsuite/logger';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import("./vcsCallback.js").VcsCallbackOptions & { layerNames: string[] }} ActivateLayersOptions
 * @property {Array<string>} layerNames - layer names to activate
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class ActivateLayersCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'ActivateLayersCallback';
  }

  /**
   * @param {ActivateLayersOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
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
      .forEach((l) =>
        l.activate().catch((e) => {
          getLogger('ActivateLayersCallback').error(
            `Could not activate layer: ${l.name}`,
            e,
          );
        }),
      );
  }

  /**
   * @returns {ActivateLayersOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.layerNames = this._layerNames.slice();
    return config;
  }
}

export default ActivateLayersCallback;
callbackClassRegistry.registerClass(
  ActivateLayersCallback.className,
  ActivateLayersCallback,
);
