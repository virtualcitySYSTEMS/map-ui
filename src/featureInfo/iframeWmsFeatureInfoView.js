import { get as getOlProj } from 'ol/proj.js';
import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import IframeComponent from './IframeComponent.vue';
import { getBalloonPositionFromFeature } from './balloonHelper.js';

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoViewOptions & { infoFormat: string, title?: string, sandbox?:string, disableSandbox?: boolean }} IframeWmsFeatureInfoViewOptions
 * @property {string} infoFormat - Specifies the response format of WMS GetFeatureInfo
 * @property {string} [title] - optional title for the <iframe>
 * @property {string} [sandbox] - optional sandbox attribute for the <iframe>
 * @property {boolean} [disableSandbox] - optional flag to disable the sandbox attribute for the <iframe>
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
   * @param {import("../vcsUiApp.js").default} app
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {import("../manager/window/windowManager.js").WindowComponentOptions}
   */
  getWindowComponentOptions(app, featureInfo, layer) {
    const position = getBalloonPositionFromFeature(
      featureInfo.feature,
      layer,
      featureInfo.position,
    );
    const componentOptions = super.getWindowComponentOptions(
      app,
      featureInfo,
      layer,
    );
    const resolution = app.maps.activeMap.getCurrentResolution(
      position.position,
    );
    componentOptions.props.src =
      layer.featureProvider.wmsSource.getFeatureInfoUrl(
        position.position,
        resolution,
        getOlProj('EPSG:3857'),
        { INFO_FORMAT: this.infoFormat },
      );
    return componentOptions;
  }

  /**
   * Gets feature info from WMS GetFeatureInfo in html/text format
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").WMSLayer} layer
   * @returns {import("./iframeFeatureInfoView.js").IframeFeatureInfoViewProps}
   */
  getProperties(featureInfo, layer) {
    const properties = super.getProperties(featureInfo, layer);
    return {
      ...properties,
      src: layer.featureProvider.wmsSource.getFeatureInfoUrl(
        featureInfo.position,
        // no correct resolution available due to missing app.
        // Thats why same is done in `getWindowComponentOptions` to override the src with correct url
        1,
        getOlProj('EPSG:3857'),
        { INFO_FORMAT: this.infoFormat },
      ),
      title: this.title,
      ...(!this.disableSandbox && { sandbox: this.sandbox }),
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
    if (this.sandbox) {
      config.sandbox = this.sandbox;
    }
    if (this.disableSandbox) {
      config.disableSandbox = this.disableSandbox;
    }
    return config;
  }
}

export default IframeWmsFeatureInfoView;
