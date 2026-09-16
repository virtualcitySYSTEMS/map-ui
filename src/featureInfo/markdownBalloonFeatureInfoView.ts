import type { Layer } from '@vcmap/core';
import BalloonFeatureInfoView, {
  type BalloonFeatureInfoViewOptions,
  type BalloonFeatureInfoViewProps,
} from './balloonFeatureInfoView.js';
import type { FeatureInfoEvent } from './featureInfo.js';
import MarkdownBalloonComponent from './MarkdownBalloonComponent.ts.vue';

type MarkdownBalloonFeatureInfoViewOptions = BalloonFeatureInfoViewOptions & {
  /** a string or an array of strings which will be concatenated using \n */
  template: string | string[];
};

type MarkdownBalloonFeatureInfoViewProps = BalloonFeatureInfoViewProps & {
  template: string | string[];
  context: Record<string, unknown>;
};

/**
 * @description A markdown Balloon Featureinfo
 */
class MarkdownBalloonFeatureInfoView extends BalloonFeatureInfoView {
  static get className(): string {
    return 'MarkdownBalloonFeatureInfoView';
  }

  static getDefaultOptions(): MarkdownBalloonFeatureInfoViewOptions {
    return {
      ...BalloonFeatureInfoView.getDefaultOptions(),
      template: '',
    };
  }

  template: string | string[];

  constructor(options: MarkdownBalloonFeatureInfoViewOptions) {
    super(options, MarkdownBalloonComponent);

    this.template = Array.isArray(options.template)
      ? options.template.slice()
      : options.template;
  }

  /**
   * Supports markdown templates (e.g. {{someProperty}}) and style expressions to derive markdown rendering
   */
  getProperties(
    featureInfo: FeatureInfoEvent,
    layer: Layer,
  ): MarkdownBalloonFeatureInfoViewProps {
    const properties = super.getProperties(featureInfo, layer);
    return {
      ...properties,
      template: this.template,
      context: {
        ...properties,
        ...properties.attributes,
      },
    };
  }

  /**
   * @param {MarkdownBalloonFeatureInfoViewOptions} defaultOptions
   * @returns {MarkdownBalloonFeatureInfoViewOptions}
   */
  toJSON(
    defaultOptions: MarkdownBalloonFeatureInfoViewOptions = MarkdownBalloonFeatureInfoView.getDefaultOptions(),
  ): MarkdownBalloonFeatureInfoViewOptions {
    const config = super.toJSON(
      defaultOptions,
    ) as MarkdownBalloonFeatureInfoViewOptions;
    if (this.template) {
      config.template = Array.isArray(this.template)
        ? this.template.slice()
        : this.template;
    }
    return config;
  }
}

export default MarkdownBalloonFeatureInfoView;
