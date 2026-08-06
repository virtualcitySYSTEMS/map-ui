import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type DeactivateLayersOptions = VcsCallbackOptions & {
  /** Layer names to deactivate */
  layerNames: string[];
};

export default class DeactivateLayersCallback extends VcsCallback {
  static get className(): string {
    return 'DeactivateLayersCallback';
  }

  private _layerNames: string[];

  constructor(options: DeactivateLayersOptions, app: VcsUiApp) {
    super(options, app);
    this._layerNames = options.layerNames;
  }

  callback(): void {
    this._layerNames
      .map((n) => this._app.layers.getByKey(n))
      .filter((l) => !!l)
      .forEach((l) => {
        l.deactivate();
      });
  }

  toJSON(): DeactivateLayersOptions {
    const config = super.toJSON() as DeactivateLayersOptions;
    config.layerNames = this._layerNames.slice();
    return config;
  }
}

callbackClassRegistry.registerClass(
  DeactivateLayersCallback.className,
  DeactivateLayersCallback,
);
