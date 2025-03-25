import { getLogger } from '@vcsuite/logger';
import { createModuleFromObjectOrUrl } from '../init.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import("./vcsCallback.js").VcsCallbackOptions & { module: import("@vcmap/core").VcsModuleConfig|string }} AddModuleCallbackOptions
 * @property {import("@vcmap/core").VcsModuleConfig|string} module - config or url to a config file
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class AddModuleCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'AddModuleCallback';
  }

  /**
   * @param {AddModuleCallbackOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {import("@vcmap/core").VcsModuleConfig|string}
     * @private
     */
    this._module = options.module;
  }

  callback() {
    createModuleFromObjectOrUrl(this._module)
      .then((module) => {
        if (module) {
          return this._app.addModule(module);
        }
        return undefined;
      })
      .catch((e) => {
        getLogger('addModuleCallback').error('Error adding module', e);
      });
  }

  /**
   * @returns {AddModuleCallbackOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.module = this._module;
    return config;
  }
}

export default AddModuleCallback;
callbackClassRegistry.registerClass(
  AddModuleCallback.className,
  AddModuleCallback,
);
