import { check } from '@vcsuite/check';
import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import { WindowSlot } from '../manager/window/windowManager.js';
import BalloonComponent from './BalloonComponent.vue';
import { getBalloonPositionFromFeature } from './balloonHelper.js';

/**
 * derive value from attributes
 * @param {string} key - key or nested key
 * @param {Object} attrs
 * @param {string|null} [defaultValue]
 * @returns {string|null}
 */
export function extractNestedKey(key, attrs, defaultValue = null) {
  check(key, String);
  check(attrs, Object);

  const keys = key.split('.');
  const derivedValue = keys.reduce((obj, prop) => obj[prop] || {}, attrs);
  return typeof derivedValue === 'string' ? derivedValue : defaultValue;
}

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoViewOptions & { balloonTitle?: string, balloonSubtitle?: string }} BalloonFeatureInfoViewOptions
 * @property {string} [balloonTitle] - optional title to overwrite default (layerName). Can be attribute key (nested key using '.'), i18n key or text
 * @property {string} [balloonSubtitle] - optional window title to overwrite default (featureId). Can be attribute key (nested key using '.'), i18n key or text
 */

/**
 * @typedef {import("./abstractFeatureInfoView.js").FeatureInfoProps & {
 *   balloonTitle: string,
 *   balloonSubtitle: string,
 *   position: import("ol/coordinate.js").Coordinate
 *   heightReference: import("@vcmap-cesium/engine").HeightReference,
 *   heightOffset: number
 * }} BalloonFeatureInfoViewProps
 */

/**
 * @class
 * @description An balloon view.
 * @extends {AbstractFeatureInfoView}
 */
class BalloonFeatureInfoView extends AbstractFeatureInfoView {
  /**
   * @type {string}
   */
  static get className() {
    return 'BalloonFeatureInfoView';
  }

  /**
   * @param {BalloonFeatureInfoViewOptions} options
   * @param {import("vue").Component<BalloonFeatureInfoViewProps, unknown, unknown>} [component=BalloonComponent]
   */
  constructor(options, component) {
    super(options, component || BalloonComponent);

    /**
     * @type {string}
     */
    this.balloonTitle = options.balloonTitle;

    /**
     * @type {string}
     */
    this.balloonSubtitle = options.balloonSubtitle;
  }

  /**
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {BalloonFeatureInfoViewProps}
   */
  getProperties(featureInfo, layer) {
    const properties = super.getProperties(featureInfo, layer);
    const { position, heightReference, heightOffset } =
      getBalloonPositionFromFeature(
        featureInfo.feature,
        layer,
        featureInfo.position,
      );
    return {
      ...properties,
      position,
      heightReference,
      heightOffset,
      balloonTitle:
        this.balloonTitle != null
          ? extractNestedKey(
              this.balloonTitle,
              properties.attributes,
              this.balloonTitle,
            )
          : properties.layerProperties.title || layer.name,
      balloonSubtitle:
        this.balloonSubtitle != null
          ? extractNestedKey(
              this.balloonSubtitle,
              properties.attributes,
              this.balloonSubtitle,
            )
          : properties.featureId,
    };
  }

  /**
   * @param {import("@src/vcsUiApp.js").default} app
   * @param {import("./featureInfo.js").FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {import("../manager/window/windowManager.js").WindowComponentOptions}
   */
  getWindowComponentOptions(app, featureInfo, layer) {
    const options = super.getWindowComponentOptions(app, featureInfo, layer);
    options.state.hideHeader = true;
    options.state.classes = ['balloon'];
    options.slot = WindowSlot.DETACHED;
    // windowPosition is handled by next render
    return options;
  }

  /**
   * @returns {BalloonFeatureInfoViewOptions}
   */
  toJSON() {
    const config = super.toJSON();
    if (this.balloonTitle) {
      config.balloonTitle = this.balloonTitle;
    }
    if (this.balloonSubtitle) {
      config.balloonSubtitle = this.balloonSubtitle;
    }
    return config;
  }
}

export default BalloonFeatureInfoView;
