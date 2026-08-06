import { FeatureLayer } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type HideObjectsCallbackOptions = VcsCallbackOptions & {
  /** Name of the layer; if omitted, objects are hidden globally */
  layerName?: string;
  /** Object IDs to hide */
  objectIds: string[];
};

/**
 * A callback to hide objects with given ids in a specific layer or globally if no layer is given.
 */
export default class HideObjectsCallback extends VcsCallback {
  static get className(): string {
    return 'HideObjectsCallback';
  }

  private _layerName: string | undefined;

  private _objectIds: string[];

  constructor(options: HideObjectsCallbackOptions, app: VcsUiApp) {
    super(options, app);
    this._layerName = options.layerName;
    this._objectIds = options.objectIds;
  }

  callback(): void {
    const app = this._app;
    if (this._layerName) {
      const layer = app.layers.getByKey(this._layerName);
      if (layer instanceof FeatureLayer) {
        layer.featureVisibility.hideObjects(this._objectIds);
      }
    } else {
      app.layers.globalHider.hideObjects(this._objectIds);
    }
  }

  toJSON(): HideObjectsCallbackOptions {
    return {
      ...super.toJSON(),
      layerName: this._layerName,
      objectIds: [...this._objectIds],
    };
  }
}

callbackClassRegistry.registerClass(
  HideObjectsCallback.className,
  HideObjectsCallback,
);
