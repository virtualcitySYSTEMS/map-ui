import { getLogger } from '@vcsuite/logger';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type RemoveModuleCallbackOptions = VcsCallbackOptions & {
  /** ID of the module to be removed */
  moduleId: string;
};

export default class RemoveModuleCallback extends VcsCallback {
  static get className(): string {
    return 'RemoveModuleCallback';
  }

  private _moduleId: string;

  constructor(options: RemoveModuleCallbackOptions, app: VcsUiApp) {
    super(options, app);
    this._moduleId = options.moduleId;
  }

  async callback(): Promise<void> {
    try {
      if (this._app.getModuleById(this._moduleId)) {
        await this._app.removeModule(this._moduleId);
      }
    } catch (e) {
      getLogger('removeModuleCallback').error('Error removing module', e);
    }
  }

  toJSON(): RemoveModuleCallbackOptions {
    const config = super.toJSON() as RemoveModuleCallbackOptions;
    config.moduleId = this._moduleId;
    return config;
  }
}

callbackClassRegistry.registerClass(
  RemoveModuleCallback.className,
  RemoveModuleCallback,
);
