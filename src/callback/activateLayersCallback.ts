import { getLogger } from '@vcsuite/logger';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type ActivateLayersOptions = VcsCallbackOptions & {
  /** Layer names to activate */
  layerNames: string[];
};

export default class ActivateLayersCallback extends VcsCallback {
  static get className(): string {
    return 'ActivateLayersCallback';
  }

  private _layerNames: string[];

  constructor(options: ActivateLayersOptions, app: VcsUiApp) {
    super(options, app);
    this._layerNames = options.layerNames;
  }

  async callback(): Promise<void> {
    const layerPromises = this._layerNames
      .map((n) => this._app.layers.getByKey(n))
      .filter((l) => !!l)
      .map((l) =>
        l.activate().catch((e: unknown) => {
          getLogger('ActivateLayersCallback').error(
            `Could not activate layer: ${l.name}`,
            e,
          );
        }),
      );

    await Promise.all(layerPromises);
  }

  toJSON(): ActivateLayersOptions {
    const config = super.toJSON() as ActivateLayersOptions;
    config.layerNames = this._layerNames.slice();
    return config;
  }
}

callbackClassRegistry.registerClass(
  ActivateLayersCallback.className,
  ActivateLayersCallback,
);
