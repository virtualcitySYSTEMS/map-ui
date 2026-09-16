import { check } from '@vcsuite/check';
import type { Layer } from '@vcmap/core';
import type { Component } from 'vue';
import type { Coordinate } from 'ol/coordinate.js';
import type { HeightReference } from '@vcmap-cesium/engine';
import type VcsUiApp from '../vcsUiApp.js';
import AbstractFeatureInfoView, {
  type FeatureInfoProps,
  type FeatureInfoViewOptions,
} from './abstractFeatureInfoView.js';
import type { WindowComponentOptions } from '../manager/window/windowManager.js';
import BalloonComponent from './BalloonComponent.ts.vue';
import { getBalloonPositionFromFeature } from './balloonHelper.js';
import type { FeatureInfoEvent } from './featureInfo.js';

/**
 * derive value from attributes
 * @param key - key or nested key
 */
export function extractNestedKey(
  key: string,
  attrs: Record<string, unknown>,
  defaultValue: string | null = null,
): string | null {
  check(key, String);
  check(attrs, Object);

  const keys = key.split('.');
  const derivedValue = keys.reduce<unknown>((obj, prop) => {
    if (obj && typeof obj === 'object' && prop in obj) {
      return (obj as Record<string, unknown>)[prop];
    }
    return undefined;
  }, attrs);
  return typeof derivedValue === 'string' ? derivedValue : defaultValue;
}

export type BalloonFeatureInfoViewOptions = FeatureInfoViewOptions & {
  /** optional title to overwrite default (layerName). Can be attribute key (nested key using '.'), i18n key or text */
  balloonTitle?: string;
  /** optional window title to overwrite default (featureId). Can be attribute key (nested key using '.'), i18n key or text */
  balloonSubtitle?: string;
};

export type BalloonFeatureInfoViewProps = FeatureInfoProps & {
  balloonTitle: string;
  balloonSubtitle: string;
  position: Coordinate;
  heightReference: HeightReference;
  heightOffset: number;
};

/**
 * @description An balloon view.
 */
class BalloonFeatureInfoView extends AbstractFeatureInfoView<BalloonFeatureInfoViewProps> {
  static get className(): string {
    return 'BalloonFeatureInfoView';
  }

  static getDefaultOptions(): BalloonFeatureInfoViewOptions {
    return {
      ...AbstractFeatureInfoView.getDefaultOptions(),
      balloonTitle: undefined,
      balloonSubtitle: undefined,
    };
  }

  balloonTitle: string | undefined;
  balloonSubtitle: string | undefined;

  constructor(options: BalloonFeatureInfoViewOptions, component?: Component) {
    super(
      options,
      (component || BalloonComponent) as Component<
        Partial<BalloonFeatureInfoViewProps>,
        unknown,
        unknown
      >,
    );

    this.balloonTitle = options.balloonTitle;
    this.balloonSubtitle = options.balloonSubtitle;
  }

  getProperties(
    featureInfo: FeatureInfoEvent,
    layer: Layer,
  ): BalloonFeatureInfoViewProps {
    const properties = super.getProperties(featureInfo, layer);
    const { position, heightReference, heightOffset } =
      getBalloonPositionFromFeature(
        featureInfo.feature,
        layer,
        featureInfo.position,
      );
    return {
      ...properties,
      position: position!,
      heightReference,
      heightOffset,
      balloonTitle:
        this.balloonTitle != null
          ? extractNestedKey(
              this.balloonTitle,
              properties.attributes,
              this.balloonTitle,
            )!
          : (properties.layerProperties.title as string) || layer.name,
      balloonSubtitle:
        this.balloonSubtitle != null
          ? extractNestedKey(
              this.balloonSubtitle,
              properties.attributes,
              this.balloonSubtitle,
            )!
          : properties.featureId,
    };
  }

  getWindowComponentOptions(
    app: VcsUiApp,
    featureInfo: FeatureInfoEvent,
    layer: Layer,
  ): WindowComponentOptions {
    const options = super.getWindowComponentOptions(app, featureInfo, layer);
    options.state!.hideHeader = true;
    options.state!.classes = ['balloon'];
    options.slot = 'detached';
    // windowPosition is handled by next render
    return options;
  }

  /**
   * @param {BalloonFeatureInfoViewOptions} defaultOptions
   * @returns {BalloonFeatureInfoViewOptions}
   */
  toJSON(
    defaultOptions: BalloonFeatureInfoViewOptions = BalloonFeatureInfoView.getDefaultOptions(),
  ): BalloonFeatureInfoViewOptions {
    const config = super.toJSON(
      defaultOptions,
    ) as BalloonFeatureInfoViewOptions;
    if (this.balloonTitle !== defaultOptions.balloonTitle) {
      config.balloonTitle = this.balloonTitle;
    }
    if (this.balloonSubtitle !== defaultOptions.balloonSubtitle) {
      config.balloonSubtitle = this.balloonSubtitle;
    }
    return config;
  }
}

export default BalloonFeatureInfoView;
