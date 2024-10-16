import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import IframeComponent from './IframeComponent.vue';

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoViewOptions & { src: string, title?: string }} IframeFeatureInfoViewOptions
 * @property {string} src - Specifies the address of the document to embed in the <iframe>. Variables wrapped in `${}` are replaced by their values, e.g. `${featureId}` or `${attributes.gml:name}`
 * @property {string} [title] - optional title for the <iframe>
 */

/**
 * @typedef {import("./abstractFeatureInfoView.js.js").FeatureInfoProps & { src: string, title?: string }} IframeFeatureInfoViewProps
 */

/**
 * @class
 * @description An iframe view.
 * @extends {AbstractFeatureInfoView}
 */
class IframeFeatureInfoView extends AbstractFeatureInfoView {
  /**
   * @type {string}
   */
  static get className() {
    return 'IframeFeatureInfoView';
  }

  /**
   * @param {IframeFeatureInfoViewOptions} options
   */
  constructor(options) {
    super(options, IframeComponent);

    /**
     * @type {string}
     */
    this.src = options.src;
    /**
     * @type {string|undefined}
     */
    this.title = options.title || undefined;
  }

  /**
   * Variables wrapped in `${}` within `src` are replaced by their values, e.g. `${featureId}` or `${attributes.gml:name}`
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {IframeFeatureInfoViewProps}
   */
  getProperties(featureInfo, layer) {
    const properties = super.getProperties(featureInfo, layer);
    return {
      ...properties,
      src: this.src.replace(/\$\{(.*?)}/g, (match, token) => {
        const variable = token.split('.');
        return variable.reduce((obj, prop) => obj?.[prop], properties);
      }),
      title: this.title,
    };
  }

  /**
   * @returns {IframeFeatureInfoViewOptions}
   */
  toJSON() {
    const config = super.toJSON();
    if (this.src) {
      config.src = this.src;
    }
    if (this.title) {
      config.title = this.title;
    }
    return config;
  }
}

export default IframeFeatureInfoView;
