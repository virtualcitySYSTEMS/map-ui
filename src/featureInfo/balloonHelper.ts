import {
  Cartesian2,
  Cartographic,
  Cesium3DTileFeature,
  Cesium3DTilePointFeature,
  Entity,
  HeightReference,
  type Scene,
  SceneTransforms,
} from '@vcmap-cesium/engine';
import {
  type AbstractFeatureProvider,
  CesiumMap,
  type EventFeature,
  type Layer,
  ObliqueMap,
  OpenlayersMap,
  Projection,
  type RelativeHeightReference,
  type VectorHeightInfo,
  type VectorLayer,
  VectorProperties,
  cartesianToMercator,
  getGeometryHeight,
  getHeightInfo,
  isAbsoluteHeightReference,
  isRelativeHeightReference,
  transformToImage,
} from '@vcmap/core';
import type { Coordinate } from 'ol/coordinate.js';
import { Point, type SimpleGeometry } from 'ol/geom.js';
import { unByKey } from 'ol/Observable.js';
import Feature from 'ol/Feature.js';
import type { Map as OLMap } from 'ol';
import { getCenter } from 'ol/extent.js';
import type VcsUiApp from '../vcsUiApp.js';
import {
  getWindowPositionOptionsFromMapEvent,
  WindowAlignment,
} from '../manager/window/windowHelper.js';
import type WindowManager from '../manager/window/windowManager.js';

/**
 * balloon offset from location or click position in pixel
 */
export const balloonOffset = { x: 50, y: 20 };

function getBalloonPositionCesium(
  scene: Scene,
  position: Coordinate,
): Cartesian2 | undefined {
  const wgs84Position = Projection.mercatorToWgs84(position);
  const cartesian = Cartographic.toCartesian(
    Cartographic.fromDegrees(
      wgs84Position[0],
      wgs84Position[1],
      wgs84Position[2] ?? 0,
    ),
  );
  return SceneTransforms.worldToWindowCoordinates(scene, cartesian);
}

/**
 * @param {import("@vcmap/core").OpenlayersMap} olMap
 * @param {import("ol/coordinate.js").Coordinate} position
 * @returns {undefined|import("@vcmap-cesium/engine").Cartesian2}
 */
function getBalloonPositionOL(
  olMap: OLMap | null,
  position: Coordinate,
): Cartesian2 | undefined {
  const pixel = olMap?.getPixelFromCoordinate(position);
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
export async function getBalloonPosition(
  app: VcsUiApp,
  position: Coordinate,
): Promise<Cartesian2 | undefined> {
  const map = app.maps.activeMap;
  if (map instanceof CesiumMap) {
    return getBalloonPositionCesium(map.getScene()!, position);
  } else if (map instanceof OpenlayersMap) {
    return getBalloonPositionOL(map.olMap, position);
  } else if (map instanceof ObliqueMap) {
    const { coords } = await transformToImage(map.currentImage!, position);
    return getBalloonPositionOL(map.olMap, coords);
  }
  return undefined;
}

/**
 * sets the windowPosition of a balloon
 * @param id - windowId of balloon
 * @param target - the map's target { @link @import("@vcmap/core").MapCollection }
 */
export function setBalloonPosition(
  windowManager: WindowManager,
  id: string,
  windowPosition: Cartesian2 | undefined,
  target: HTMLElement | null,
): void {
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
 * @param clickedPosition - position in mercator
 */
export async function setupBalloonPositionListener(
  vcsApp: VcsUiApp,
  windowId: string,
  clickedPosition: Coordinate,
): Promise<() => void> {
  const listeners: Array<() => void> = [];

  const destroy = (): void => {
    listeners.forEach((cb) => {
      cb();
    });
  };

  const setup = async (
    app: VcsUiApp,
    id: string,
    position: Coordinate,
  ): Promise<void> => {
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
        map.getScene()!.postRender.addEventListener((scene) => {
          setBalloonPosition(
            app.windowManager,
            windowId,
            getBalloonPositionCesium(scene, position),
            app.maps.target,
          );
        }),
      );
    } else if (map instanceof OpenlayersMap) {
      const handler = (): void => {
        setBalloonPosition(
          app.windowManager,
          windowId,
          getBalloonPositionOL(map.olMap, position),
          app.maps.target,
        );
      };
      const key = map.olMap?.on('postrender', handler);
      if (key) {
        listeners.push(() => {
          unByKey(key);
        });
      }
    } else if (map instanceof ObliqueMap) {
      const { coords } = await transformToImage(map.currentImage!, position);
      listeners.push(
        map.imageChanged!.addEventListener(
          setup.bind(null, app, windowId, position),
        ),
      );
      const handler = (): void => {
        setBalloonPosition(
          app.windowManager,
          windowId,
          getBalloonPositionOL(map.olMap, coords),
          app.maps.target,
        );
      };
      const key = map.olMap?.on('postrender', handler);
      if (key) {
        listeners.push(() => {
          unByKey(key);
        });
      }
    }
  };

  await setup(vcsApp, windowId, clickedPosition);

  return destroy;
}

export function getBalloonPositionFromFeature(
  feature: EventFeature,
  layer: Layer,
  clickedPosition?: Coordinate,
): {
  position?: Coordinate;
  heightReference: HeightReference;
  heightOffset: number;
} {
  let heightReference = HeightReference.NONE;
  let heightOffset = 0;
  let position = null;
  if (feature instanceof Feature && feature.getGeometry() instanceof Point) {
    const point = feature.getGeometry() as SimpleGeometry;
    const vectorProperties =
      (layer as VectorLayer).vectorProperties ??
      (layer.featureProvider as AbstractFeatureProvider)?.vectorProperties ??
      new VectorProperties({});
    const renderAs = vectorProperties.renderAs(feature);
    if (renderAs === 'geometry') {
      // special case where we do not want to use the clickedPosition but the exact Position of the Point
      const heightInfo = getHeightInfo(feature, point, vectorProperties);
      ({ heightReference } = heightInfo);
      let height = clickedPosition?.[2] ?? 0;
      position = point.getCoordinates()!;
      // if clamped, do nothing
      if (isRelativeHeightReference(heightReference)) {
        const info = heightInfo as VectorHeightInfo<RelativeHeightReference>;
        height = getGeometryHeight(point, heightInfo);
        if (info.groundLevel != null) {
          // we have a groundLevel, so no need to clamp the point
          heightReference = HeightReference.NONE;
        }
        if (info.heightAboveGround != null) {
          heightOffset += info.heightAboveGround;
        }
        const extrudedHeight = info.storeyHeightsAboveGround.reduce(
          (acc, storeyHeight) => acc + storeyHeight,
          0,
        );
        heightOffset += extrudedHeight;
        height += extrudedHeight;
        position = [position[0], position[1], height];
      } else if (isAbsoluteHeightReference(heightReference)) {
        const info = heightInfo as VectorHeightInfo<HeightReference.NONE>;
        const extrudedHeight = info.storeyHeightsAboveGround.reduce(
          (acc, storeyHeight) => acc + storeyHeight,
          0,
        );
        position = [
          position[0],
          position[1],
          info.groundLevelOrMinHeight + extrudedHeight,
        ];
      }
      return { position, heightOffset, heightReference };
    }
  }
  if (clickedPosition) {
    position = clickedPosition.slice();
  } else if (feature instanceof Feature && feature.getGeometry()) {
    position = getCenter(feature.getGeometry()!.getExtent());
  } else if (feature instanceof Entity) {
    position = cartesianToMercator(feature.position!.getValue()!);
  } else if (
    (feature instanceof Cesium3DTileFeature ||
      feature instanceof Cesium3DTilePointFeature) &&
    feature?.primitive?.boundingSphere?.center
  ) {
    position = cartesianToMercator(feature.primitive.boundingSphere.center);
  }
  return { position: position as Coordinate, heightReference, heightOffset };
}
