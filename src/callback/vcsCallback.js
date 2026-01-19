import { ClassRegistry } from '@vcmap/core';

/**
 * @type {ClassRegistry<typeof VcsCallback>}
 */
export const callbackClassRegistry = new ClassRegistry();

/**
 * Creates instances of VcsCallback classes and executes their `callback()`.
 *
 * Note: this function does not await promise-returning callbacks.
 * @param {import("@src/vcsUiApp.js").default} app
 * @param {Array<VcsCallbackOptions>} vcsCallbackOptions
 * @returns {void}
 */
export function executeCallbacks(app, vcsCallbackOptions) {
  vcsCallbackOptions.forEach((options) =>
    app.callbackClassRegistry.createFromTypeOptions(options, app)?.callback(),
  );
}

/**
 * Creates instances of VcsCallback classes and executes their `callback()` sequentially.
 * Awaits promise-returning callbacks before continuing with the next one.
 * @param {import("@src/vcsUiApp.js").default} app
 * @param {Array<VcsCallbackOptions>} vcsCallbackOptions
 * @returns {Promise<void>}
 */
export async function executeAsyncCallbacks(app, vcsCallbackOptions) {
  for (const options of vcsCallbackOptions) {
    const callbackInstance = app.callbackClassRegistry.createFromTypeOptions(
      options,
      app,
    );
    if (callbackInstance) {
      // eslint-disable-next-line no-await-in-loop
      await callbackInstance.callback();
    }
  }
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

  /**
   * @returns {void | Promise<void>}
   */
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
