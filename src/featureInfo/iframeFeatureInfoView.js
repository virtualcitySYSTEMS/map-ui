import { renderTemplate } from '@vcmap/core';
import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import IframeComponent from './IframeComponent.vue';

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoViewOptions & { src: string, title?: string, sandbox?:string, disableSandbox?: boolean }} IframeFeatureInfoViewOptions
 * @property {string} src - Specifies the address of the document to embed in the <iframe>. Variables wrapped in `${}` are replaced by their values, e.g. `${featureId}` or `${gml:name}`
 * @property {string} [title] - optional title for the <iframe>
 * @property {string} [sandbox] - optional sandbox attribute for the <iframe>
 * @property {boolean} [disableSandbox] - optional flag to disable the sandbox attribute for the <iframe>
 */

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoProps & { src: string, title?: string, sandbox?:string }} IframeFeatureInfoViewProps
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
    /**
     * @type {string}
     */
    this.sandbox = options.sandbox || '';
    /**
     * @type {boolean}
     */
    this.disableSandbox = options.disableSandbox || false;
  }

  /**
   * @param {Record<string, unknown>} attributes
   * @protected
   * @returns {string}
   */
  _renderTemplate(attributes) {
    return renderTemplate(this.src, attributes);
  }

  /**
   * Supports markdown templates (e.g. {{someProperty}}) and style expressions to derive a URL
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {IframeFeatureInfoViewProps}
   */
  getProperties(featureInfo, layer) {
    const properties = super.getProperties(featureInfo, layer);
    return {
      ...properties,
      src: this._renderTemplate({
        ...properties,
        ...properties.attributes,
      }),
      title: this.title,
      ...(!this.disableSandbox && { sandbox: this.sandbox }),
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
    if (this.sandbox) {
      config.sandbox = this.sandbox;
    }
    if (this.disableSandbox) {
      config.disableSandbox = this.disableSandbox;
    }
    return config;
  }
}

export default IframeFeatureInfoView;
