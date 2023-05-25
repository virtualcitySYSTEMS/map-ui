import { VcsCallback } from '@vcmap/ui';

/**
 * @typedef {VcsCallbackOptions} SwitchMapCallbackOptions
 * @property {string} mapName - name of the map
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class SwitchMapCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'SwitchMapCallback';
  }

  /**
   * @param {SwitchMapCallbackOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {string}
     * @private
     */
    this._mapName = options.mapName;
  }

  callback() {
    this._app.maps.setActiveMap(this._mapName);
  }

  /**
   * @returns {SwitchMapCallbackOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.mapName = this._mapName;
    return config;
  }
}

export default SwitchMapCallback;
