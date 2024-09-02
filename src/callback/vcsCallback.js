import { ClassRegistry } from '@vcmap/core';

/**
 * @type {ClassRegistry<typeof VcsCallback>}
 */
export const callbackClassRegistry = new ClassRegistry();

/**
 * creates instances of VcsCallback classes and executes its callback function
 * @param {import("@src/vcsUiApp.js").default} app
 * @param {Array<VcsCallbackOptions>} vcsCallbackOptions
 */
export function executeCallbacks(app, vcsCallbackOptions) {
  vcsCallbackOptions.forEach((options) =>
    app.callbackClassRegistry.createFromTypeOptions(options, app)?.callback(),
  );
}

/**
 * @typedef {Object} VcsCallbackOptions
 * @property {string} type
 */

/**
 * @class
 * @abstract
 */
class VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'VcsCallback';
  }

  /**
   * @param {VcsCallbackOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    /**
     * @protected
     * @type {import("@src/vcsUiApp.js").default}
     */
    this._app = app;
  }

  // eslint-disable-next-line class-methods-use-this
  callback() {}

  /**
   * @returns {VcsCallbackOptions}
   */
  toJSON() {
    return {
      type: this.constructor.className,
    };
  }
}

export default VcsCallback;
