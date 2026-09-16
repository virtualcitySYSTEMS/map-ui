import type { Layer } from '@vcmap/core';
import AbstractFeatureInfoView, {
  type FeatureInfoProps,
  type FeatureInfoViewOptions,
} from './abstractFeatureInfoView.js';
import VcsTemplateMarkdown from '../components/form-output/VcsTemplateMarkdown.vue';
import type { FeatureInfoEvent } from './featureInfo.js';

type MarkdownFeatureInfoViewOptions = FeatureInfoViewOptions & {
  /** a string or an array of strings which will be concatenated using \n */
  template: string | string[];
};

type MarkdownFeatureInfoViewProps = FeatureInfoProps & {
  template: string | string[];
  context: Record<string, unknown>;
};

/**
 * @description A simple markdown feature info view. will render feature attributes into the markdown and replace {{}}
 */
class MarkdownFeatureInfoView extends AbstractFeatureInfoView<MarkdownFeatureInfoViewProps> {
  static get className(): string {
    return 'MarkdownFeatureInfoView';
  }

  static getDefaultOptions(): MarkdownFeatureInfoViewOptions {
    return {
      ...AbstractFeatureInfoView.getDefaultOptions(),
      template: '',
    };
  }

  template: string | string[];

  constructor(options: MarkdownFeatureInfoViewOptions) {
    super(options, VcsTemplateMarkdown);

    this.template = Array.isArray(options.template)
      ? options.template.slice()
      : options.template;
  }

  /**
   * Supports markdown templates (e.g. {{someProperty}}) and style expressions to derive a markdown rendering
   */
  getProperties(
    featureInfo: FeatureInfoEvent,
    layer: Layer,
  ): MarkdownFeatureInfoViewProps {
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

  toJSON(
    defaultOptions: MarkdownFeatureInfoViewOptions = MarkdownFeatureInfoView.getDefaultOptions(),
  ): MarkdownFeatureInfoViewOptions {
    const config = super.toJSON(
      defaultOptions,
    ) as MarkdownFeatureInfoViewOptions;
    if (this.template !== defaultOptions.template) {
      config.template = Array.isArray(this.template)
        ? this.template.slice()
        : this.template;
    }
    return config;
  }
}

export default MarkdownFeatureInfoView;
