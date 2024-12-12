import { CesiumMap, startRotation } from '@vcmap/core';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import("./vcsCallback.js").VcsCallbackOptions & { viewpoint: string, timePerRotation: number }} StartRotationOptions
 * @property {string?} viewpoint - name of the viewpoint
 * @property {number?} timePerRotation - time in seconds for a full rotation
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class StartRotationCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'StartRotationCallback';
  }

  /**
   * @param {StartRotationOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {string | undefined}
     * @private
     */
    this._viewpoint = options.viewpoint;
    /**
     * @type {number | undefined}
     * @private
     */
    this._timePerRotation = options.timePerRotation;
  }

  async callback() {
    const vp = this._app.viewpoints.getByKey(this._viewpoint);
    const speed = this._timePerRotation;
    if (this._app.maps.activeMap instanceof CesiumMap) {
      await startRotation(this._app, vp, speed);
    }
  }

  /**
   * @returns {StartRotationOptions}
   */
  toJSON() {
    const config = super.toJSON();
    if (this._viewpoint) {
      config.viewpoint = this._viewpoint;
    }
    if (this._timePerRotation) {
      config.timePerRotation = this._timePerRotation;
    }
    return config;
  }
}

export default StartRotationCallback;
callbackClassRegistry.registerClass(
  StartRotationCallback.className,
  StartRotationCallback,
);
