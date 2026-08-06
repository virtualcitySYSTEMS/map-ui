import { getLogger } from '@vcsuite/logger';
import type { VcsModuleConfig } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import { createModuleFromObjectOrUrl } from '../init.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type AddModuleCallbackOptions = VcsCallbackOptions & {
  /** Config or url to a config file */
  module: VcsModuleConfig | string;
};

export default class AddModuleCallback extends VcsCallback {
  static get className(): string {
    return 'AddModuleCallback';
  }

  private _module: VcsModuleConfig | string;

  constructor(options: AddModuleCallbackOptions, app: VcsUiApp) {
    super(options, app);
    this._module = options.module;
  }

  async callback(): Promise<void> {
    try {
      const module = await createModuleFromObjectOrUrl(this._module);
      if (module) {
        await this._app.addModule(module);
      }
    } catch (e) {
      getLogger(AddModuleCallback.className).error('Error adding module', e);
    }
  }

  toJSON(): AddModuleCallbackOptions {
    const config = super.toJSON() as AddModuleCallbackOptions;
    config.module = this._module;
    return config;
  }
}

callbackClassRegistry.registerClass(
  AddModuleCallback.className,
  AddModuleCallback,
);
