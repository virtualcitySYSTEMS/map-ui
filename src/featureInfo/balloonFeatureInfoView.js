import { Feature } from 'ol';
import { getCenter } from 'ol/extent.js';
import Point from 'ol/geom/Point.js';
import {
  Cartographic,
  Entity,
  HeightReference,
  Math as CesiumMath,
} from '@vcmap-cesium/engine';
import {
  getGeometryHeight,
  getHeightInfo,
  isAbsoluteHeightReference,
  isRelativeHeightReference,
  Projection,
} from '@vcmap/core';
import { check } from '@vcsuite/check';
import AbstractFeatureInfoView from './abstractFeatureInfoView.js';
import { WindowSlot } from '../manager/window/windowManager.js';
import BalloonComponent from './BalloonComponent.vue';

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
 *   heightReference: HeightReference,
 *   heightOffset: number
 * }} BalloonFeatureInfoViewProps
 */

/**
 * @param {import("@vcmap/core").Cartesian3} cartesian
 * @returns {import("ol/coordinate.js").Coordinate}
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
 * @param {import("@vcmap/core").Layer} layer
 * @param {import("ol/coordinate.js").Coordinate|undefinded} clickedPosition
 * @returns {{position?: import("ol/coordinate.js").Coordinate, heightReference: HeightReference, heightOffset: number}}
 */
function getPositionFromFeature(feature, layer, clickedPosition) {
  let heightReference = HeightReference.NONE;
  let heightOffset = 0;
  let position = null;
  if (feature instanceof Feature && feature.getGeometry() instanceof Point) {
    const point = feature.getGeometry();
    const renderAs = layer.vectorProperties.renderAs(feature);
    if (renderAs === 'geometry') {
      // special case where we do not want to use the clickedPosition but the exact Position of the Point
      const heightInfo = getHeightInfo(feature, point, layer.vectorProperties);
      ({ heightReference } = heightInfo);
      let height = clickedPosition?.[2] ?? 0;
      position = point.getCoordinates();
      // if clamped, do nothing
      if (isRelativeHeightReference(heightReference)) {
        height = getGeometryHeight(point, heightInfo);
        if (heightInfo.groundLevel != null) {
          // we have a groundLevel, so no need to clamp the point
          heightReference = HeightReference.NONE;
        }
        if (heightInfo.heightAboveGround != null) {
          heightOffset += heightInfo.heightAboveGround;
        }
        const extrudedHeight = heightInfo.storeyHeightsAboveGround.reduce(
          (acc, storeyHeight) => acc + storeyHeight,
          0,
        );
        heightOffset += extrudedHeight;
        height += extrudedHeight;
        position = [position[0], position[1], height];
      } else if (isAbsoluteHeightReference(heightReference)) {
        const extrudedHeight = heightInfo.storeyHeightsAboveGround.reduce(
          (acc, storeyHeight) => acc + storeyHeight,
          0,
        );
        position = [
          position[0],
          position[1],
          heightInfo.groundLevelOrMinHeight + extrudedHeight,
        ];
      }
      return { position, heightOffset, heightReference };
    }
  }
  if (clickedPosition) {
    position = clickedPosition.slice();
  } else if (feature instanceof Feature && feature.getGeometry()) {
    position = getCenter(feature.getGeometry().getExtent());
  } else if (feature instanceof Entity) {
    position = cartesian3ToCoordinate(feature.position);
  } else if (feature?.primitive?.boundingSphere?.center) {
    position = cartesian3ToCoordinate(feature.primitive.boundingSphere.center);
  }
  return { position, heightReference, heightOffset };
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
    const { position, heightReference, heightOffset } = getPositionFromFeature(
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
