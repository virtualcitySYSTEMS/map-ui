import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type ActivateClippingPolygonOptions = VcsCallbackOptions & {
  /** Names of the ClippingPolygonObjects to activate */
  names: string[];
};

export default class ActivateClippingPolygonCallback extends VcsCallback {
  static get className(): string {
    return 'ActivateClippingPolygonCallback';
  }
  private _names: string[];

  constructor(options: ActivateClippingPolygonOptions, app: VcsUiApp) {
    super(options, app);
    this._names = options.names;
  }

  callback(): void {
    this._names
      .map((n) => this._app.clippingPolygons.getByKey(n))
      .filter((l) => l)
      .forEach((l) => {
        l?.activate();
      });
  }

  toJSON(): ActivateClippingPolygonOptions {
    const config = super.toJSON() as ActivateClippingPolygonOptions;
    config.names = this._names.slice();
    return config;
  }
}

callbackClassRegistry.registerClass(
  ActivateClippingPolygonCallback.className,
  ActivateClippingPolygonCallback,
);
