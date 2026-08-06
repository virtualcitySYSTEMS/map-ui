import { FeatureLayer } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type ShowObjectsCallbackOptions = VcsCallbackOptions & {
  /** Name of the layer; if omitted, objects are shown globally */
  layerName?: string;
  /** Object IDs to show */
  objectIds: string[];
};

/**
 * A callback to show objects that were previously hidden.
 */
export default class ShowObjectsCallback extends VcsCallback {
  static get className(): string {
    return 'ShowObjectsCallback';
  }

  private _layerName: string | undefined;

  private _objectIds: string[];

  constructor(options: ShowObjectsCallbackOptions, app: VcsUiApp) {
    super(options, app);
    this._layerName = options.layerName;
    this._objectIds = options.objectIds;
  }

  callback(): void {
    const app = this._app;
    if (this._layerName) {
      const layer = app.layers.getByKey(this._layerName);
      if (layer instanceof FeatureLayer) {
        layer.featureVisibility.showObjects(this._objectIds);
      }
    } else {
      app.layers.globalHider.showObjects(this._objectIds);
    }
  }

  toJSON(): ShowObjectsCallbackOptions {
    return {
      ...super.toJSON(),
      layerName: this._layerName,
      objectIds: [...this._objectIds],
    };
  }
}

callbackClassRegistry.registerClass(
  ShowObjectsCallback.className,
  ShowObjectsCallback,
);
