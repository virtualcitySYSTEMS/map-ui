import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import("./vcsCallback.js").VcsCallbackOptions & { viewpoint: string }} GoToViewpointOptions
 * @property {string} viewpoint - name of the viewpoint
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class GoToViewpointCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'GoToViewpointCallback';
  }

  /**
   * @param {GoToViewpointOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {string}
     * @private
     */
    this._viewpoint = options.viewpoint;
  }

  async callback() {
    const vp = this._app.viewpoints.getByKey(this._viewpoint);
    if (this._app.maps.activeMap && vp) {
      await this._app.maps.activeMap.gotoViewpoint(vp);
    }
  }

  /**
   * @returns {GoToViewpointOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.viewpoint = this._viewpoint;
    return config;
  }
}

export default GoToViewpointCallback;
callbackClassRegistry.registerClass(
  GoToViewpointCallback.className,
  GoToViewpointCallback,
);
