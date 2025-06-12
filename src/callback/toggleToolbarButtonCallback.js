import { getLogger } from '@vcsuite/logger';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';
import { ToolboxType } from '../manager/toolbox/toolboxManager.js';
import { callSafeAction } from '../actions/actionHelper.js';

/**
 * @typedef {import("./vcsCallback.js").VcsCallbackOptions & { componentId: string, groupButtonId?:string }} ToggleToolbarButtonOptions
 * @property {string} componentId - id of the Toolbar button
 * @property {string} [groupButtonId] - id of the button to toggle, in case of a GroupComponentToolbox
 * @property {string} [toolName] - name of the tool to toggle, in case of a SelectComponentToolbox
 * @property {boolean} [activeState] - state to be applied to the button
 */

/**
 * @class
 * @extends {VcsCallback}
 */
class ToggleToolbarButtonCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'ToggleToolbarButtonCallback';
  }

  /**
   * @param {ToggleToolbarButtonOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);
    /**
     * @type {string}
     * @private
     */
    this._componentId = options.componentId;
    /**
     * @type {string|undefined}
     * @private
     */
    this._groupButtonId = options.groupButtonId;
    /**
     * @type {string|undefined}
     * @private
     */
    this._toolName = options.toolName;
    /**
     * @type {boolean|undefined}
     * @private
     */
    this._activeState = options.activeState;
  }

  callback() {
    let action;
    const component = this._app.toolboxManager.get(this._componentId);
    if (component?.type === ToolboxType.GROUP && this._groupButtonId) {
      const btn = component.buttonManager.get(this._groupButtonId);
      if (btn?.action) {
        ({ action } = btn);
      }
    } else if (component?.type === ToolboxType.SELECT) {
      try {
        const { tools } = component.action;
        const toolIndex = tools.findIndex((t) => t.name === this._toolName);
        if (toolIndex) {
          component.action.selected(toolIndex);
          ({ action } = component);
        }
      } catch (error) {
        getLogger(this.className).error(
          `Error while setting tool ${this._toolName}:`,
          error,
        );
      }
    } else if (component?.type === ToolboxType.SINGLE) {
      ({ action } = component);
    }

    if (
      action &&
      (this._activeState === undefined ||
        action.active === undefined ||
        action.active !== this._activeState)
    ) {
      callSafeAction(action);
    }
  }

  /**
   * @returns {ToggleToolbarButtonOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.componentId = this._componentId;
    if (this._groupButtonId) {
      config.groupButtonId = this._groupButtonId;
    }
    if (this._toolName) {
      config.toolName = this._toolName;
    }
    if (this._activeState) {
      config.activeState = this._activeState;
    }
    return config;
  }
}

export default ToggleToolbarButtonCallback;

// Register the class
callbackClassRegistry.registerClass(
  ToggleToolbarButtonCallback.className,
  ToggleToolbarButtonCallback,
);
