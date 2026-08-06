import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type DeactivateClippingPolygonOptions = VcsCallbackOptions & {
  /** Names of the ClippingPolygonObjects to deactivate */
  names: string[];
};

export default class DeactivateClippingPolygonCallback extends VcsCallback {
  static get className(): string {
    return 'DeactivateClippingPolygonCallback';
  }

  private _names: string[];

  constructor(options: DeactivateClippingPolygonOptions, app: VcsUiApp) {
    super(options, app);
    this._names = options.names;
  }

  callback(): void {
    this._names
      .map((n) => this._app.clippingPolygons.getByKey(n))
      .filter((l) => !!l)
      .forEach((l) => {
        l.deactivate();
      });
  }

  toJSON(): DeactivateClippingPolygonOptions {
    const config = super.toJSON() as DeactivateClippingPolygonOptions;
    config.names = this._names.slice();
    return config;
  }
}

callbackClassRegistry.registerClass(
  DeactivateClippingPolygonCallback.className,
  DeactivateClippingPolygonCallback,
);
