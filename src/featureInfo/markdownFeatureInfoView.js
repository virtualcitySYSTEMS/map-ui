import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import {
  parseAndSanitizeMarkdown,
  renderTemplate,
} from '../application/markdownHelper.js';
import MarkdownComponent from './MarkdownComponent.vue';

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoViewOptions & { template: string | string[] }} MarkdownFeatureInfoViewOptions
 * @property {string | string[]} template - a string or an array of strings which will be concatenated using \n
 */

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoProps & { html: string }} MarkdownFeatureInfoViewProps
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

  /**
   * @param {MarkdownFeatureInfoViewOptions} options
   */
  constructor(options) {
    super(options, MarkdownComponent);

    /**
     * @type {string | string[]}
     */
    this.template = Array.isArray(options.template)
      ? options.template.slice()
      : options.template;
  }

  /**
   * @param {Record<string, unknown>} attributes
   * @protected
   * @returns {string}
   */
  _renderTemplate(attributes) {
    return renderTemplate(this.template, attributes);
  }

  /**
   * Variables wrapped in `${}` within `src` are replaced by their values, e.g. `${featureId}` or `${attributes.gml:name}`
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {MarkdownFeatureInfoViewProps}
   */
  getProperties(featureInfo, layer) {
    const properties = super.getProperties(featureInfo, layer);
    return {
      ...properties,
      html: parseAndSanitizeMarkdown(
        this._renderTemplate({ ...properties, ...properties.attributes }),
      ),
    };
  }

  /**
   * @returns {MarkdownFeatureInfoViewOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.template = Array.isArray(this.template)
      ? this.template.slice()
      : this.template;
    return config;
  }
}

export default MarkdownFeatureInfoView;
