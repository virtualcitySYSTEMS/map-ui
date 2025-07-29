import { getLogger } from '@vcsuite/logger';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import("./vcsCallback.js").VcsCallbackOptions & { mapName: string }} ActivateMapCallbackOptions
 * @property {string} mapName
 */

/**
 * Callback to activate a map by name using the app's map collection.
 * @class
 * @extends VcsCallback
 */
class ActivateMapCallback extends VcsCallback {
  /**
   * @param {ActivateMapCallbackOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {string}
     * @private
     */
    this._mapName = options.mapName;
  }

  /**
   * Activates the map with the given name.
   */
  callback() {
    if (this._mapName) {
      this._app.maps.setActiveMap(this._mapName).catch((error) => {
        getLogger(ActivateMapCallback.className).error(
          `Failed to activate map "${this._mapName}":`,
          error,
        );
      });
    }
  }

  /**
   * @returns {ActivateMapCallbackOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.mapName = this._mapName;
    return config;
  }

  /**
   * @type {string}
   */
  static get className() {
    return 'ActivateMapCallback';
  }
}

callbackClassRegistry.registerClass(
  ActivateMapCallback.className,
  ActivateMapCallback,
);
export default ActivateMapCallback;
