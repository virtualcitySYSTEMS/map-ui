import {
  markVolatile,
  maxZIndex,
  mercatorProjection,
  Projection,
  VectorLayer,
  VectorStyleItem,
} from '@vcmap/core';
import { Circle, Point } from 'ol/geom.js';
import { Feature } from 'ol';
import { Color } from '@vcmap-cesium/engine';
import CircleStyle from 'ol/style/Circle.js';
import { Fill, Stroke } from 'ol/style.js';
import type VcsUiApp from '../vcsUiApp.js';
import { NotificationType } from '../notifier/notifier.js';
import { getDefaultPrimaryColor } from '../vuePlugins/vuetify.js';
import type { DestroyableAction } from '../actions/actionHelper.js';

type LocatorState = {
  coordinates: GeolocationCoordinates | undefined;
  prevCoordinates: GeolocationCoordinates | undefined;
  id: number | undefined;
};

/**
 * Request the Color and add opacity
 */
function getColor(opacity: number, app: VcsUiApp): string {
  return Color.fromCssColorString(
    app.uiConfig.config.primaryColor ?? getDefaultPrimaryColor(app),
  )
    .withAlpha(opacity)
    .toCssColorString();
}

/**
 * Place a location point and accuracy circle on the map.
 * @param layer The OpenLayers layer to add the features to.
 * @param point The point object containing longitude, latitude, and accuracy.
 */
function placeLocationInMap(
  layer: VectorLayer,
  point: GeolocationCoordinates,
): void {
  layer.removeFeaturesById(['_tooltipLocationPoint']);
  layer.removeFeaturesById(['_tooltipLocationCircle']);

  const featurePoint = [point.longitude, point.latitude];

  const feature = new Feature({
    geometry: new Point(Projection.wgs84ToMercator(featurePoint)),
    olcs_extrudedHeight: 80,
    olcs_altitudeMode: 'clampToGround',
  });
  feature.setId('_tooltipLocationPoint');

  const accuracyCircle = new Feature({
    geometry: new Circle(
      Projection.wgs84ToMercator([point.longitude, point.latitude]),
      point.accuracy,
    ),
    olcs_altitudeMode: 'clampToGround',
  });
  accuracyCircle.setId('_tooltipLocationCircle');
  layer.addFeatures([accuracyCircle, feature]);
}
/**
 * Calculate the Euclidean distance between two coordinates.
 * @param coord First set of coordinates.
 * @param prevCoord Second set of coordinates.
 * @returns The Euclidean distance between the coordinates in meters.
 */
function getDistance(
  coord: GeolocationCoordinates,
  prevCoord: GeolocationCoordinates,
): number {
  const dx = prevCoord.longitude - coord.longitude;
  const dy = prevCoord.latitude - coord.latitude;
  // Approximate distance using Pythagoras' theorem
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Moves the map view to a specified position, optionally setting a distance.
 * @param position The position object containing current coordinates and accuracy.
 * @param app The VcsUiApp instance.
 */
async function goToLocator(
  distance: number | null,
  position: GeolocationCoordinates,
  app: VcsUiApp,
): Promise<void> {
  const viewpoint = await app.maps.activeMap?.getViewpoint();
  if (viewpoint) {
    viewpoint.animate = true;
    viewpoint.cameraPosition = null;
    viewpoint.groundPosition = [position.longitude, position.latitude];
    if (viewpoint.pitch >= -30) {
      viewpoint.pitch = -30;
    }

    if (distance != null) {
      viewpoint.distance = distance;
    }
    viewpoint.duration = 1;
    await app.maps.activeMap?.gotoViewpoint(viewpoint);
  }
}

/**
 * Handles the success of geolocation, updating the map accordingly.
 * @param vectorLayer The vector layer on which to place the location.
 * @param app The VcsUiApp instance.
 * @param state The state object containing previous and current coordinates.
 * @param position The position object containing current coordinates and accuracy.
 */
async function handleSuccess(
  vectorLayer: VectorLayer,
  app: VcsUiApp,
  state: LocatorState,
  position: GeolocationPosition,
): Promise<void> {
  if (
    position.coords.longitude !== state.prevCoordinates?.longitude ||
    position.coords.latitude !== state.prevCoordinates?.latitude ||
    position.coords.accuracy !== state.prevCoordinates?.accuracy
  ) {
    state.coordinates = position.coords;

    if (state.prevCoordinates === undefined || state.prevCoordinates === null) {
      await goToLocator(state.coordinates.accuracy, position.coords, app);
    } else if (getDistance(position.coords, state.prevCoordinates) > 5) {
      await goToLocator(state.coordinates.accuracy, position.coords, app);
    }
    placeLocationInMap(vectorLayer, state.coordinates);
    state.prevCoordinates = position.coords;
  }
}

/**
 * Handles errors that occur during geolocation, displaying appropriate notifications based on the error code.
 * @param app The VcsUiApp instance.
 * @param state The state object.
 * @param error The error object containing information about the geolocation error.
 */
function handleError(
  app: VcsUiApp,
  state: LocatorState,
  error: GeolocationPositionError,
): void {
  if (state.prevCoordinates === undefined || state.prevCoordinates === null) {
    switch (error.code) {
      case 1:
        app.notifier.add({
          type: NotificationType.ERROR,
          message: app.vueI18n.t('navigation.locator.errorAccess'),
        });
        break;
      case 2:
        app.notifier.add({
          type: NotificationType.ERROR,
          message: app.vueI18n.t('navigation.locator.errorCurrentPosition'),
        });
        break;
      case 3:
        app.notifier.add({
          type: NotificationType.ERROR,
          message: app.vueI18n.t('navigation.locator.errorConnection'),
        });
        break;
      default:
        app.notifier.add({
          type: NotificationType.ERROR,
          message: app.vueI18n.t('navigation.locator.errorPosition'),
        });
        break;
    }
  }
}

const geolocationOptions = {
  enableHighAccuracy: true,
  maximumAge: 10000,
  timeout: 5000,
};

export function createLocatorAction(app: VcsUiApp): DestroyableAction {
  let primary = getColor(0.4, app);

  let pointColor = getColor(1, app);

  const style = new VectorStyleItem({
    fill: {
      color: primary,
    },
    stroke: { color: pointColor, width: 2 },
    image: {
      fill: {
        color: pointColor,
      },
      color: primary,
      stroke: { color: pointColor, width: 2 },
      radius: 5,
    },
  });
  const vectorLayer = new VectorLayer({
    projection: mercatorProjection.toJSON(),
    vectorProperties: {
      classificationType: 'both',
      allowPicking: false,
      heightAboveGround: 2,
      altitudeMode: 'clampToGround',
    },
    zIndex: maxZIndex,
    style,
  });

  markVolatile(vectorLayer);
  app.layers.add(vectorLayer);

  const destroyLayer = (): void => {
    vectorLayer.deactivate();
    app.layers.remove(vectorLayer);
    vectorLayer.destroy();
  };

  const state: LocatorState = {
    coordinates: undefined,
    prevCoordinates: undefined,
    id: undefined,
  };

  const themeListener = app.themeChanged.addEventListener(() => {
    primary = getColor(0.4, app);
    pointColor = getColor(1, app);
    style.fillColor = primary;
    style.stroke?.setColor(pointColor);
    style.image = new CircleStyle({
      fill: new Fill({ color: pointColor }),
      stroke: new Stroke({ color: pointColor, width: 2 }),
      radius: 5,
    });
    vectorLayer.forceRedraw().catch(() => {});
  });

  const action = {
    name: 'alertAction',
    title: 'Locator',
    icon: '$vcsCrosshair',
    active: false,
    disabled: true,
    async callback(): Promise<void> {
      if (!this.active) {
        this.active = !this.active;
        vectorLayer.activate().catch(() => {});
        if (state.prevCoordinates !== undefined) {
          await goToLocator(
            state.prevCoordinates.accuracy,
            state.prevCoordinates,
            app,
          );
        }
        state.id = navigator.geolocation.watchPosition(
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          handleSuccess.bind(null, vectorLayer, app, state),
          handleError.bind(null, app, state),
          geolocationOptions,
        );
      } else {
        this.active = !this.active;
        state.coordinates = undefined;
        navigator.geolocation.clearWatch(state.id ?? 0);
        vectorLayer.deactivate();
      }
    },
  };
  const destroy = (): void => {
    destroyLayer();
    themeListener();
    style.destroy();
    state.coordinates = undefined;
    state.prevCoordinates = undefined;
    state.id = undefined;
  };
  return { action, destroy };
}
