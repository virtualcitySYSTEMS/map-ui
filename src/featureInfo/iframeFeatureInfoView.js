import AbstractFeatureInfoView from './abstractFeatureInfoView.js';

/**
 * @description An iframe component
 * @vue-prop {string} src - Specifies the address of the document to embed in the <iframe>
 * @vue-prop {string} [title] - optional title for the <iframe>
 */
const IframeComponent = {
  name: 'IframeComponent',
  props: {
    src: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: undefined,
    },
  },
  template: '<iframe :src="src" :title="title" />',
};

/**
 * @typedef {FeatureInfoViewOptions} IframeFeatureInfoViewOptions
 * @property {string} src - Specifies the address of the document to embed in the <iframe>. Variables wrapped in `${}` are replaced by their values, e.g. `${featureId}` or `${attributes.gml:name}`
 * @property {string} [title] - optional title for the <iframe>
 */

/**
 * @typedef {FeatureInfoProps} IframeFeatureInfoViewProps
 * @property {string} src
 * @property {string|undefined} title
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
   * @param {FeatureInfoEvent} featureInfo
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
