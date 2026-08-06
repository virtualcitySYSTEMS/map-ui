import { FeatureLayer, VectorStyleItem } from '@vcmap/core';
import type { VectorStyleItemOptions } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type HighlightObjectsCallbackOptions = VcsCallbackOptions & {
  /** Name of the layer containing the objects to highlight */
  layerName: string;
  /** Map of object IDs to their highlight style options */
  toHighlight: Record<string, VectorStyleItemOptions>;
};

/**
 * A callback to highlight objects of FeatureLayers.
 */
export default class HighlightObjectsCallback extends VcsCallback {
  static get className(): string {
    return 'HighlightObjectsCallback';
  }

  private _layerName: string;

  private _toHighlight: Record<string, VectorStyleItemOptions>;

  constructor(options: HighlightObjectsCallbackOptions, app: VcsUiApp) {
    super(options, app);
    this._layerName = options.layerName;
    this._toHighlight = options.toHighlight;
  }

  callback(): void {
    const app = this._app;
    const layer = app.layers.getByKey(this._layerName);

    if (layer instanceof FeatureLayer) {
      const toHighlightInstances: Record<string, VectorStyleItem> = {};
      Object.keys(this._toHighlight).forEach((key) => {
        toHighlightInstances[key] = new VectorStyleItem(this._toHighlight[key]);
      });
      layer.featureVisibility.highlight(toHighlightInstances);
    }
  }

  toJSON(): HighlightObjectsCallbackOptions {
    return {
      ...super.toJSON(),
      layerName: this._layerName,
      toHighlight: structuredClone(this._toHighlight),
    };
  }
}

callbackClassRegistry.registerClass(
  HighlightObjectsCallback.className,
  HighlightObjectsCallback,
);
