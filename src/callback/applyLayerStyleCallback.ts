import { FeatureLayer } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type ApplyLayerStyleOptions = VcsCallbackOptions & {
  /** Name of the style */
  styleName: string;
  /** Name of the layer to apply the style */
  layerName: string;
};

export default class ApplyLayerStyleCallback extends VcsCallback {
  static get className(): string {
    return 'ApplyLayerStyleCallback';
  }

  private _styleName: string;

  private _layerName: string;

  constructor(options: ApplyLayerStyleOptions, app: VcsUiApp) {
    super(options, app);
    this._styleName = options.styleName;
    this._layerName = options.layerName;
  }

  callback(): void {
    const style = this._app.styles.getByKey(this._styleName);
    const layer = this._app.layers.getByKey(this._layerName);
    if (style && layer && layer instanceof FeatureLayer) {
      layer.setStyle(style);
    }
  }
  toJSON(): ApplyLayerStyleOptions {
    const config = super.toJSON() as ApplyLayerStyleOptions;
    config.styleName = this._styleName;
    config.layerName = this._layerName;
    return config;
  }
}

callbackClassRegistry.registerClass(
  ApplyLayerStyleCallback.className,
  ApplyLayerStyleCallback,
);
