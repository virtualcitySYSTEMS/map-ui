import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import("./vcsCallback.js").VcsCallbackOptions & { moduleId: string }} RemoveModuleCallbackOptions
 * @property {string} moduleId - id of module to be removed
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class RemoveModuleCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'RemoveModuleCallback';
  }

  /**
   * @param {RemoveModuleCallbackOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {string}
     * @private
     */
    this._moduleId = options.moduleId;
  }

  callback() {
    if (this._app.getModuleById(this._moduleId)) {
      this._app.removeModule(this._moduleId);
    }
  }

  /**
   * @returns {RemoveModuleCallbackOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.moduleId = this._moduleId;
    return config;
  }
}

export default RemoveModuleCallback;
callbackClassRegistry.registerClass(
  RemoveModuleCallback.className,
  RemoveModuleCallback,
);
