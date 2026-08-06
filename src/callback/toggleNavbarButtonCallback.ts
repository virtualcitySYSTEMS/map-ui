import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type ToggleNavbarButtonOptions = VcsCallbackOptions & {
  /** ID of the Navbar button */
  buttonId: string;
  /** State to be applied to the button */
  activeState?: boolean;
};

export default class ToggleNavbarButtonCallback extends VcsCallback {
  static get className(): string {
    return 'ToggleNavbarButtonCallback';
  }

  private _buttonId: string;

  private _activeState: boolean | undefined;

  constructor(options: ToggleNavbarButtonOptions, app: VcsUiApp) {
    super(options, app);
    this._buttonId = options.buttonId;
    this._activeState = options.activeState;
  }

  callback(): void {
    this._app.navbarManager.toggle(this._buttonId, this._activeState);
  }

  toJSON(): ToggleNavbarButtonOptions {
    const config = super.toJSON() as ToggleNavbarButtonOptions;
    config.buttonId = this._buttonId;
    if (this._activeState !== undefined) {
      config.activeState = this._activeState;
    }
    return config;
  }
}

callbackClassRegistry.registerClass(
  ToggleNavbarButtonCallback.className,
  ToggleNavbarButtonCallback,
);
