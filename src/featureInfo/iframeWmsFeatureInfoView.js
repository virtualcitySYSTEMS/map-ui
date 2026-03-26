import {
  getMetersPerDegreeAtCoordinate,
  mercatorProjection,
} from '@vcmap/core';
import { parseBoolean } from '@vcsuite/parsers';
import { get as getOlProj, getTransform } from 'ol/proj.js';
import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import IframeComponent from './IframeComponent.vue';
import { getBalloonPositionFromFeature } from './balloonHelper.js';

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoViewOptions & { infoFormat: string, title?: string, sandbox?:string, disableSandbox?: boolean }} IframeWmsFeatureInfoViewOptions
 * @property {string} [infoFormat='text/html'] - Specifies the response format of WMS GetFeatureInfo
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

  /** @returns {IframeWmsFeatureInfoViewOptions} */
  static getDefaultOptions() {
    return {
      ...AbstractFeatureInfoView.getDefaultOptions(),
      infoFormat: 'text/html',
      title: undefined,
      sandbox: '',
      disableSandbox: false,
    };
  }

  /**
   * @param {IframeWmsFeatureInfoViewOptions} options
   */
  constructor(options) {
    super(options, IframeComponent);
    const defaultOptions = IframeWmsFeatureInfoView.getDefaultOptions();

    /**
     * @type {string}
     */
    this.infoFormat = options.infoFormat || defaultOptions.infoFormat;
    /**
     * @type {string|undefined}
     */
    this.title = options.title;
    /**
     * @type {string}
     */
    this.sandbox = options.sandbox || defaultOptions.sandbox;
    /**
     * @type {boolean}
     */
    this.disableSandbox = parseBoolean(
      options.disableSandbox,
      defaultOptions.disableSandbox,
    );
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

    let res = resolution;
    const projection = layer.featureProvider.wmsSource.getProjection();
    const transform = getTransform(mercatorProjection.proj, projection);
    const coords = transform(position.position.slice());
    if (projection.getUnits() === 'degrees') {
      const metersPerDegree = getMetersPerDegreeAtCoordinate(coords);
      res = resolution / metersPerDegree;
    }
    componentOptions.props.src =
      layer.featureProvider.wmsSource.getFeatureInfoUrl(
        coords,
        res,
        projection,
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
   * @param {IframeWmsFeatureInfoViewOptions} defaultOptions
   * @returns {IframeWmsFeatureInfoViewOptions}
   */
  toJSON(defaultOptions = IframeWmsFeatureInfoView.getDefaultOptions()) {
    const config = super.toJSON(defaultOptions);
    if (this.infoFormat !== defaultOptions.infoFormat) {
      config.infoFormat = this.infoFormat;
    }
    if (this.title !== defaultOptions.title) {
      config.title = this.title;
    }
    if (this.sandbox !== defaultOptions.sandbox) {
      config.sandbox = this.sandbox;
    }
    if (this.disableSandbox !== defaultOptions.disableSandbox) {
      config.disableSandbox = this.disableSandbox;
    }
    return config;
  }
}

export default IframeWmsFeatureInfoView;
