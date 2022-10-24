import { Feature } from 'ol';
import { getCenter } from 'ol/extent.js';
import { Cartographic, Entity, Math as CesiumMath } from '@vcmap/cesium';
import { Projection } from '@vcmap/core';
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
 * @property {import("ol/coordinate").Coordinate} position
 */

/**
 * @param {import("@vcmap/core").Cartesian3} cartesian
 * @returns {import("ol/coordinate").Coordinate}
 */
function cartesian3ToCoordinate(cartesian) {
  const cartographic = Cartographic.fromCartesian(cartesian);
  const wgs84position = [
    CesiumMath.toDegrees(cartographic.longitude),
    CesiumMath.toDegrees(cartographic.latitude),
    cartographic.height,
  ];
  return Projection.wgs84ToMercator(wgs84position);
}

/**
 * @param {FeatureType} feature
 * @returns {import("ol/coordinate").Coordinate|null}
 */
function getPositionFromFeature(feature) {
  if (feature instanceof Feature && feature.getGeometry()) {
    return getCenter(feature.getGeometry().getExtent());
  } else if (feature instanceof Entity) {
    return cartesian3ToCoordinate(feature.position);
  } else if (feature?.primitive?.boundingSphere?.center) {
    return cartesian3ToCoordinate(feature.primitive.boundingSphere.center);
  }
  return null;
}

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
      position: featureInfo.position ?? getPositionFromFeature(featureInfo.feature),
      title: this.title != null ?
        extractNestedKey(this.title, properties.attributes, this.title) :
        properties.layerProperties.title,
      subtitle: this.subtitle != null ?
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
    options.state.hideHeader = true;
    options.state.classes = ['balloon'];
    options.slot = WindowSlot.DETACHED;
    options.position = getWindowPositionOptions(
      (featureInfo.windowPosition?.[0] ?? 0) - balloonOffset.x, // if we do not have a windowPosition, let the next render handle it
      (featureInfo.windowPosition?.[1] ?? 0) - balloonOffset.y,
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
