import { v4 as uuidv4, v5 as uuidv5 } from 'uuid';

/**
 * @typedef {Object} VcsAppConfig
 * @property {string|undefined} [id]
 * @property {Array<import("@vcmap/core").LayerOptions>} [layers]
 * @property {Array<import("@vcmap/core").VcsMapOptions>} [maps]
 * @property {Array<import("@vcmap/core").StyleItemOptions>} [styles]
 * @property {Array<import("@vcmap/core").ViewPointOptions>} [viewpoints]
 * @property {string} [startingViewPointName]
 * @property {string} [startingMapName]
 * @property {import("@vcmap/core").ProjectionOptions} [projection]
 * @property {Array<Object>} [plugins]
 */

/**
 * @type {string}
 */
const uuidNamespace = uuidv4();

class Context {
  /**
   * @param {VcsAppConfig} config
   */
  constructor(config) {
    /**
     * @type {VcsAppConfig}
     * @private
     */
    this._config = config;
    /**
     * @type {string}
     * @private
     */
    this._checkSum = uuidv5(JSON.stringify(config), uuidNamespace);
    /**
     * @type {string}
     * @private
     */
    this._id = config.id || this._checkSum;
  }

  /**
   * @type {string}
   * @readonly
   */
  get id() {
    return this._id;
  }

  /**
   * @type {string}
   * @return {string}
   */
  get checkSum() {
    return this._checkSum;
  }

  /**
   * @type {VcsAppConfig}
   * @readonly
   */
  get config() {
    return JSON.parse(JSON.stringify(this._config));
  }
}

export default Context;
