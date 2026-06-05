import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import VcsTemplateMarkdown from '../components/form-output/VcsTemplateMarkdown.vue';

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoViewOptions & { template: string | string[] }} MarkdownFeatureInfoViewOptions
 * @property {string | string[]} template - a string or an array of strings which will be concatenated using \n
 */

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoProps & { template: string }} MarkdownFeatureInfoViewProps
 */

/**
 * @class
 * @description A simple markdown feature info view. will render feature attributes into the markdown and replace {{}}
 * @extends {AbstractFeatureInfoView}
 */
class MarkdownFeatureInfoView extends AbstractFeatureInfoView {
  /**
   * @type {string}
   */
  static get className() {
    return 'MarkdownFeatureInfoView';
  }

  /** @returns {MarkdownFeatureInfoViewOptions} */
  static getDefaultOptions() {
    return {
      ...AbstractFeatureInfoView.getDefaultOptions(),
      template: '',
    };
  }

  /**
   * @param {MarkdownFeatureInfoViewOptions} options
   */
  constructor(options) {
    super(options, VcsTemplateMarkdown);

    /**
     * @type {string | string[]}
     */
    this.template = Array.isArray(options.template)
      ? options.template.slice()
      : options.template;
  }

  /**
   * Supports markdown templates (e.g. {{someProperty}}) and style expressions to derive a markdown rendering
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {MarkdownFeatureInfoViewProps}
   */
  getProperties(featureInfo, layer) {
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
   * @param {MarkdownFeatureInfoViewOptions} defaultOptions
   * @returns {MarkdownFeatureInfoViewOptions}
   */
  toJSON(defaultOptions = MarkdownFeatureInfoView.getDefaultOptions()) {
    const config = super.toJSON(defaultOptions);
    if (this.template !== defaultOptions.template) {
      config.template = Array.isArray(this.template)
        ? this.template.slice()
        : this.template;
    }
    return config;
  }
}

export default MarkdownFeatureInfoView;
