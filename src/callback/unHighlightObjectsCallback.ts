import { FeatureLayer } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type UnHighlightObjectsCallbackOptions = VcsCallbackOptions & {
  /** Name of the layer containing the objects to unhighlight */
  layerName: string;
  /** IDs of the objects to unhighlight */
  toUnHighlight: (string | number)[];
};

/**
 * A callback to unhighlight previously highlighted objects of a FeatureLayer.
 */
export default class UnHighlightObjectsCallback extends VcsCallback {
  static get className(): string {
    return 'UnHighlightObjectsCallback';
  }

  private _layerName: string;

  private _toUnHighlight: (string | number)[];

  constructor(options: UnHighlightObjectsCallbackOptions, app: VcsUiApp) {
    super(options, app);
    this._layerName = options.layerName;
    this._toUnHighlight = options.toUnHighlight;
  }

  callback(): void {
    const app = this._app;
    const layer = app.layers.getByKey(this._layerName);

    if (layer instanceof FeatureLayer) {
      layer.featureVisibility.unHighlight(this._toUnHighlight);
    }
  }

  toJSON(): UnHighlightObjectsCallbackOptions {
    return {
      ...super.toJSON(),
      layerName: this._layerName,
      toUnHighlight: [...this._toUnHighlight],
    };
  }
}

callbackClassRegistry.registerClass(
  UnHighlightObjectsCallback.className,
  UnHighlightObjectsCallback,
);
