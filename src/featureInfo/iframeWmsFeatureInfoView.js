import { get as getOlProj } from 'ol/proj.js';
import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import IframeComponent from './IframeComponent.vue';

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoViewOptions & { infoFormat: string, title?: string }} IframeWmsFeatureInfoViewOptions
 * @property {string} infoFormat - Specifies the response format of WMS GetFeatureInfo
 * @property {string} [title] - optional title for the <iframe>
 */

/**
 * @class
 * @description An iframe view.
 * @extends {AbstractFeatureInfoView}
 */
class IframeWmsFeatureInfoView extends AbstractFeatureInfoView {
  /**
   * @type {string}
   */
  static get className() {
    return 'IframeWmsFeatureInfoView';
  }

  /**
   * @param {IframeWmsFeatureInfoViewOptions} options
   */
  constructor(options) {
    super(options, IframeComponent);

    /**
     * @type {string}
     */
    this.infoFormat = options.infoFormat || 'text/html';
    /**
     * @type {string|undefined}
     */
    this.title = options.title || undefined;
  }

  /**
   * Gets feature info from WMS GetFeatureInfo in html/text format
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").WMSLayer} layer
   * @returns {import("./iframeFeatureInfoView.js").IframeFeatureInfoViewProps}
   */
  getProperties(featureInfo, layer) {
    return {
      src: layer.featureProvider.wmsSource.getFeatureInfoUrl(
        featureInfo.position,
        1,
        getOlProj('EPSG:3857'),
        { INFO_FORMAT: this.infoFormat },
      ),
      title: this.title,
    };
  }

  /**
   * @returns {IframeWmsFeatureInfoViewOptions}
   */
  toJSON() {
    const config = super.toJSON();
    if (this.infoFormat) {
      config.infoFormat = this.infoFormat;
    }
    if (this.title) {
      config.title = this.title;
    }
    return config;
  }
}

export default IframeWmsFeatureInfoView;
