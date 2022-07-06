import { check } from '@vcsuite/check';
import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import { getWindowPositionOptions, WindowAlignment, WindowSlot } from '../manager/window/windowManager.js';
import BalloonComponent from './BalloonComponent.vue';
import { balloonOffset } from './balloonHelper.js';

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
  const derivedValue = keys.reduce((obj, prop) => (obj[prop] || {}), attrs);
  return typeof derivedValue === 'string' ? derivedValue : defaultValue;
}

/**
 * @typedef {FeatureInfoViewOptions} BalloonFeatureInfoViewOptions
 * @property {string} [title] - optional title to overwrite default (layerName). Can be attribute key (nested key using '.'), i18n key or text
 * @property {string} [subtitle] - optional window title to overwrite default (featureId). Can be attribute key (nested key using '.'), i18n key or text
 */

/**
 * @typedef {FeatureInfoProps} BalloonFeatureInfoViewProps
 * @property {string} title
 * @property {string} subtitle
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
  static get className() { return 'BalloonFeatureInfoView'; }

  /**
   * @param {BalloonFeatureInfoViewOptions} options
   * @param {import("vue").Component} [component=BalloonComponent]
   */
  constructor(options, component) {
    super(options, component || BalloonComponent);

    /**
     * @type {string}
     */
    this.title = options.title;

    /**
     * @type {string}
     */
    this.subtitle = options.subtitle;
  }

  /**
   * @param {FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {BalloonFeatureInfoViewProps}
   */
  getProperties(featureInfo, layer) {
    const properties = super.getProperties(featureInfo, layer);
    return {
      ...properties,
      title: this.title ?
        extractNestedKey(this.title, properties.attributes, this.title) :
        properties.layerProperties.title,
      subtitle: this.subtitle ?
        extractNestedKey(this.subtitle, properties.attributes, this.subtitle) :
        properties.featureId,
    };
  }

  /**
   * @param {FeatureInfoEvent} featureInfo
   * @param {import("@vcmap/core").Layer} layer
   * @returns {WindowComponentOptions}
   */
  getWindowComponentOptions(featureInfo, layer) {
    const options = super.getWindowComponentOptions(featureInfo, layer);
    const { windowPosition } = featureInfo;
    options.state.hideHeader = true;
    options.state.classes = ['balloon'];
    options.slot = WindowSlot.DETACHED;
    options.position = getWindowPositionOptions(
      windowPosition.x - balloonOffset.x,
      windowPosition.y - balloonOffset.y,
      null,
      WindowAlignment.BOTTOM_LEFT,
    );
    return options;
  }

  /**
   * @returns {BalloonFeatureInfoViewOptions}
   */
  toJSON() {
    const config = super.toJSON();
    if (this.title) {
      config.title = this.title;
    }
    if (this.subtitle) {
      config.subtitle = this.subtitle;
    }
    return config;
  }
}

export default BalloonFeatureInfoView;
