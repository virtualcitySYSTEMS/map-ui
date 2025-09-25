import {
  Cartesian2,
  Cartographic,
  SceneTransforms,
  HeightReference,
  Entity,
} from '@vcmap-cesium/engine';
import {
  cartesianToMercator,
  CesiumMap,
  getGeometryHeight,
  getHeightInfo,
  isAbsoluteHeightReference,
  isRelativeHeightReference,
  ObliqueMap,
  OpenlayersMap,
  Projection,
  transformToImage,
  VectorProperties,
} from '@vcmap/core';
import { unByKey } from 'ol/Observable.js';
import Feature from 'ol/Feature.js';
import { Point } from 'ol/geom.js';
import { getCenter } from 'ol/extent.js';
import {
  getWindowPositionOptionsFromMapEvent,
  WindowAlignment,
} from '../manager/window/windowHelper.js';

/**
 * balloon offset from location or click position in pixel
 * @type {{x: number, y: number}}
 */
export const balloonOffset = { x: 55, y: 25 };

/**
 * @param {import("@vcmap-cesium/engine").Scene} scene
 * @param {import("ol/coordinate.js").Coordinate} position
 * @returns {undefined|import("@vcmap-cesium/engine").Cartesian2}
 */
function getBalloonPositionCesium(scene, position) {
  const wgs84Position = Projection.mercatorToWgs84(position);
  const cartesian = Cartographic.toCartesian(
    Cartographic.fromDegrees(...wgs84Position),
  );
  return SceneTransforms.worldToWindowCoordinates(scene, cartesian);
}

/**
 * @param {import("@vcmap/core").OpenlayersMap} olMap
 * @param {import("ol/coordinate.js").Coordinate} position
 * @returns {undefined|import("@vcmap-cesium/engine").Cartesian2}
 */
function getBalloonPositionOL(olMap, position) {
  const pixel = olMap.getPixelFromCoordinate(position);
  if (pixel) {
    return new Cartesian2(...pixel);
  }
  return undefined;
}

/**
 * returns the windowPosition of a balloon from a map position
 * @param {import("@vcmap/core").VcsApp} app
 * @param {import("ol/coordinate.js").Coordinate} position - position in mercator
 * @returns {Promise<undefined|Cartesian2>}
 */
export async function getBalloonPosition(app, position) {
  const map = app.maps.activeMap;
  if (map instanceof CesiumMap) {
    return getBalloonPositionCesium(map.getScene(), position);
  } else if (map instanceof OpenlayersMap) {
    return getBalloonPositionOL(map.olMap, position);
  } else if (map instanceof ObliqueMap) {
    const { coords } = await transformToImage(map.currentImage, position);
    return getBalloonPositionOL(map.olMap, coords);
  }
  return undefined;
}

/**
 * sets the windowPosition of a balloon
 * @param {import("../manager/window/windowManager.js").default} windowManager
 * @param {string} id - windowId of balloon
 * @param {import("@vcmap-cesium/engine").Cartesian2|undefined} windowPosition
 * @param {HTMLElement} target - the map's target { @link @import("@vcmap/core").MapCollection }
 */
export function setBalloonPosition(windowManager, id, windowPosition, target) {
  if (!windowPosition || !windowManager.has(id)) {
    return;
  }

  const { width, height, maxWidth, maxHeight } = windowManager.get(id).position;
  const mapWindowPosition = getWindowPositionOptionsFromMapEvent(
    new Cartesian2(
      windowPosition.x - balloonOffset.x,
      windowPosition.y - balloonOffset.y,
    ),
    target,
    WindowAlignment.BOTTOM_LEFT,
  );

  windowManager.setWindowPositionOptions(id, {
    width,
    height,
    maxWidth,
    maxHeight,
    ...mapWindowPosition,
  });
}

/**
 * @param {import("@vcmap/core").VcsApp} vcsApp
 * @param {string} windowId
 * @param {import("ol/coordinate.js").Coordinate} clickedPosition - position in mercator
 * @returns {Promise<(() => void)>}
 */
export async function setupBalloonPositionListener(
  vcsApp,
  windowId,
  clickedPosition,
) {
  const listeners = [];

  const destroy = () => {
    listeners.forEach((cb) => cb());
  };

  const setup = async (app, id, position) => {
    destroy();

    listeners.push(
      app.maps.mapActivated.addEventListener(
        setup.bind(null, app, id, position),
      ),
    );

    const map = app.maps.activeMap;
    if (map instanceof CesiumMap) {
      if (!position[2]) {
        const [position3D] = await map.getHeightFromTerrain([position]);
        position[2] = position3D[2];
      }
      listeners.push(
        map.getScene().postRender.addEventListener((scene) => {
          setBalloonPosition(
            app.windowManager,
            windowId,
            getBalloonPositionCesium(scene, position),
            app.maps.target,
          );
        }),
      );
    } else if (map instanceof OpenlayersMap) {
      const handler = () =>
        setBalloonPosition(
          app.windowManager,
          windowId,
          getBalloonPositionOL(map.olMap, position),
          app.maps.target,
        );
      const key = map.olMap.on('postrender', handler);
      listeners.push(() => unByKey(key));
    } else if (map instanceof ObliqueMap) {
      const { coords } = await transformToImage(map.currentImage, position);
      listeners.push(
        map.imageChanged.addEventListener(
          setup.bind(null, app, windowId, position),
        ),
      );
      const handler = () =>
        setBalloonPosition(
          app.windowManager,
          windowId,
          getBalloonPositionOL(map.olMap, coords),
          app.maps.target,
        );
      const key = map.olMap.on('postrender', handler);
      listeners.push(() => unByKey(key));
    }
  };

  await setup(vcsApp, windowId, clickedPosition);

  return destroy;
}

/**
 * @param {Feature} feature
 * @param {import("@vcmap/core").Layer} layer
 * @param {import("ol/coordinate.js").Coordinate|undefined} clickedPosition
 * @returns {{position?: import("ol/coordinate.js").Coordinate, heightReference: HeightReference, heightOffset: number}}
 */
export function getBalloonPositionFromFeature(feature, layer, clickedPosition) {
  let heightReference = HeightReference.NONE;
  let heightOffset = 0;
  let position = null;
  if (feature instanceof Feature && feature.getGeometry() instanceof Point) {
    const point = feature.getGeometry();
    const vectorProperties =
      layer.vectorProperties ??
      layer.featureProvider?.vectorProperties ??
      new VectorProperties();
    const renderAs = vectorProperties.renderAs(feature);
    if (renderAs === 'geometry') {
      // special case where we do not want to use the clickedPosition but the exact Position of the Point
      const heightInfo = getHeightInfo(feature, point, vectorProperties);
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
    position = cartesianToMercator(feature.position);
  } else if (feature?.primitive?.boundingSphere?.center) {
    position = cartesianToMercator(feature.primitive.boundingSphere.center);
  }
  return { position, heightReference, heightOffset };
}
