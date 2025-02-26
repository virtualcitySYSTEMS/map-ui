import {
  Cartesian2,
  Cartographic,
  SceneTransforms,
} from '@vcmap-cesium/engine';
import {
  CesiumMap,
  ObliqueMap,
  OpenlayersMap,
  Projection,
  transformToImage,
} from '@vcmap/core';
import { unByKey } from 'ol/Observable.js';
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
