import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import("./vcsCallback.js").VcsCallbackOptions & { buttonId: string, activeState?:boolean }} ToggleNavbarButtonOptions
 * @property {string} buttonId - id of the Navbar button
 * @property {boolean} [activeState] - state to be applied to the button
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class ToggleNavbarButtonCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'ToggleNavbarButtonCallback';
  }

  /**
   * @param {ToggleNavbarButtonOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {string}
     * @private
     */
    this._buttonId = options.buttonId;
    /**
     * @type {boolean|undefined}
     * @private
     */
    this._activeState = options.activeState;
  }

  callback() {
    this._app.navbarManager.toggle(this._buttonId, this._activeState);
  }

  /**
   * @returns {ToggleNavbarButtonOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.buttonId = this._buttonId;
    if (this._activeState) {
      config.activeState = this._activeState;
    }
    return config;
  }
}

export default ToggleNavbarButtonCallback;

// Register the class
callbackClassRegistry.registerClass(
  ToggleNavbarButtonCallback.className,
  ToggleNavbarButtonCallback,
);
