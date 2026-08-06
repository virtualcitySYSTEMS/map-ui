import { getLogger } from '@vcsuite/logger';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';
import type {
  GroupToolboxComponent,
  SelectToolboxComponent,
  SingleToolboxComponent,
  ToolboxComponent,
} from '../manager/toolbox/toolboxManager.js';
import { ToolboxType } from '../manager/toolbox/toolboxManager.js';
import { callSafeAction } from '../actions/actionHelper.js';

type ToggleToolbarButtonOptions = VcsCallbackOptions & {
  /** ID of the Toolbar button */
  componentId: string;
  /** ID of the button to toggle, in case of a GroupComponentToolbox */
  groupButtonId?: string;
  /** Name of the tool to toggle, in case of a SelectComponentToolbox */
  toolName?: string;
  /** State to be applied to the button */
  activeState?: boolean;
};

function isGroupComponent(
  component: ToolboxComponent,
): component is GroupToolboxComponent {
  return component.type === ToolboxType.GROUP;
}
function isSelectComponent(
  component: ToolboxComponent,
): component is SelectToolboxComponent {
  return component.type === ToolboxType.SELECT;
}
function isSingleComponent(
  component: ToolboxComponent,
): component is SingleToolboxComponent {
  return component.type === ToolboxType.SINGLE;
}

export default class ToggleToolbarButtonCallback extends VcsCallback {
  static get className(): string {
    return 'ToggleToolbarButtonCallback';
  }

  private _componentId: string;

  private _groupButtonId: string | undefined;

  private _toolName: string | undefined;

  private _activeState: boolean | undefined;

  constructor(options: ToggleToolbarButtonOptions, app: VcsUiApp) {
    super(options, app);
    this._componentId = options.componentId;
    this._groupButtonId = options.groupButtonId;
    this._toolName = options.toolName;
    this._activeState = options.activeState;
  }

  callback(): void {
    let action;
    const component = this._app.toolboxManager.get(this._componentId);
    if (isGroupComponent(component) && this._groupButtonId) {
      const btn = component.buttonManager.get(this._groupButtonId);
      if (btn?.action) {
        ({ action } = btn);
      }
    } else if (isSelectComponent(component)) {
      try {
        const { tools } = component.action;
        const toolIndex = tools.findIndex((t) => t.name === this._toolName);
        if (toolIndex) {
          component.action.selected(toolIndex);
          ({ action } = component);
        }
      } catch (error) {
        getLogger(ToggleToolbarButtonCallback.className).error(
          `Error while setting tool ${this._toolName}:`,
          error,
        );
      }
    } else if (isSingleComponent(component)) {
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

  toJSON(): ToggleToolbarButtonOptions {
    const config = super.toJSON() as ToggleToolbarButtonOptions;
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

callbackClassRegistry.registerClass(
  ToggleToolbarButtonCallback.className,
  ToggleToolbarButtonCallback,
);
