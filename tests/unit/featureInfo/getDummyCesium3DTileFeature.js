// eslint-disable-next-line max-classes-per-file
import {
  Cartesian3,
  BoundingSphere,
  Cesium3DTileset as ActualCesium3DTileset,
  Cesium3DTileFeature as ActualCesium3DTileFeature, Cartographic, Math as CesiumMath,
} from '@vcmap/cesium';
import { Projection } from '@vcmap/core';

export const center = new Cartesian3(6378136.99999985, 0.9796115189807924, 0.9730536272300268);

class Cesium3DTileset {
  constructor() {
    this.boundingSphere = new BoundingSphere(center, 1);
  }
}

export function getDummyCesium3DTileset() {
  const dummy = new Cesium3DTileset();
  // eslint-disable-next-line no-proto
  dummy.__proto__ = ActualCesium3DTileset.prototype; // proto hack to fool instanceof checks
  return dummy;
}

class Cesium3DTileFeature {
  constructor() {
    this.primitive = getDummyCesium3DTileset();
  }
}

export function getDummyCesium3DTileFeature() {
  const dummy = new Cesium3DTileFeature();
  // eslint-disable-next-line no-proto
  dummy.__proto__ = ActualCesium3DTileFeature.prototype; // proto hack to fool instanceof checks
  return dummy;
}

/**
 * @returns {import("ol/coordinate").Coordinate} dummy center in wgs84 coordinates
 */
export function getDummyCenterWGS84() {
  const cartographic = Cartographic.fromCartesian(center);
  const wgs84position = [
    CesiumMath.toDegrees(cartographic.longitude),
    CesiumMath.toDegrees(cartographic.latitude),
    cartographic.height,
  ];
  return Projection.wgs84ToMercator(wgs84position);
}
