import {
  parseAndSanitizeMarkdown,
  replaceAttributes,
} from '../application/markdownHelper.js';
import BalloonFeatureInfoView from './balloonFeatureInfoView.js';
import MarkdownBalloonComponent from './MarkdownBalloonComponent.vue';

/**
 * @typedef {import("./balloonFeatureInfoView.js").BalloonFeatureInfoViewOptions & { template: string | string[] }} MarkdownBalloonFeatureInfoViewOptions
 * @property {string | string[]} template - a string or an array of strings which will be concatenated using \n
 */

/**
 * @typedef {import("./balloonFeatureInfoView.js").BalloonFeatureInfoViewProps & { html: string }} MarkdownBalloonFeatureInfoViewProps
 */

/**
 * @class
 * @description A markdown Balloon Featureinfo
 * @extends {BalloonFeatureInfoView}
 */
class MarkdownBalloonFeatureInfoView extends BalloonFeatureInfoView {
  /**
   * @type {string}
   */
  static get className() {
    return 'MarkdownBalloonFeatureInfoView';
  }

  /**
   * @param {MarkdownBalloonFeatureInfoViewOptions} options
   */
  constructor(options) {
    super(options, MarkdownBalloonComponent);

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
    return replaceAttributes(this.template, attributes);
  }

  /**
   * Variables wrapped in `${}` within `src` are replaced by their values, e.g. `${featureId}` or `${attributes.gml:name}`
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {MarkdownBalloonFeatureInfoViewProps}
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
   * @returns {MarkdownBalloonFeatureInfoViewOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.template = Array.isArray(this.template)
      ? this.template.slice()
      : this.template;
    return config;
  }
}

export default MarkdownBalloonFeatureInfoView;
