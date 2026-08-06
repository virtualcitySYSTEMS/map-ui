import type {
  AbstractInteraction,
  CesiumMap,
  EventFeature,
  InteractionEvent,
  ObliqueMap,
  OpenlayersMap,
} from '@vcmap/core';
import {
  cartesianToMercator,
  FeatureProviderInteraction,
  getFeatureFromPickObject,
  isProvidedClusterFeature,
  isProvidedFeature,
  markVolatile,
  maxZIndex,
  mercatorProjection,
  mercatorToCartesian,
  moduleIdSymbol,
  originalFeatureSymbol,
  vcsLayerName,
  vectorClusterGroupName,
  VectorLayer,
  VectorStyleItem,
  volatileModuleId,
} from '@vcmap/core';
import { Feature } from 'ol';
import type { Map as OLMap } from 'ol';
import { Point, LineString } from 'ol/geom.js';
import { Icon } from 'ol/style.js';
import type { Scene } from '@vcmap-cesium/engine';
import { Cartesian3, Ray } from '@vcmap-cesium/engine';
import { watch } from 'vue';
import { getLogger } from '@vcsuite/logger';
import type VcsUiApp from '../vcsUiApp.js';
import { getColorByKey } from '../vuePlugins/vuetify.js';
import ClusterFeatureComponent from '../featureInfo/ClusterFeatureComponent.vue';
import { WindowSlot } from '../manager/window/windowManager.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import {
  featureInfoViewSymbol,
  getFeatureInfoViewForFeature,
  getGroupedFeatureList,
} from '../featureInfo/featureInfo.js';
import { getColoredMapIcon } from '../components/icons/+all.js';
import type { VcsAction } from './actionHelper.js';

const scratchCartesian = new Cartesian3();
const pickingZOffset = 10.0;
const iconScale = 1.5;

export const deepPickingWindowId = 'deep-picking-window';

export function setupDeepPickingLayer(app: VcsUiApp): {
  layer: VectorLayer;
  destroy: () => void;
} {
  const layer = new VectorLayer({
    zIndex: maxZIndex,
    projection: mercatorProjection.toJSON(),
    vectorProperties: {
      altitudeMode: 'absolute',
      eyeOffset: [0, 0, -200],
    },
    allowPicking: false,
  });
  markVolatile(layer);
  app.layers.add(layer);
  layer.activate().catch(() => {
    getLogger('deepPickingAction').error(
      'Could not activate deep picking layer',
    );
  });

  const style = new VectorStyleItem({
    image: {
      ...getColoredMapIcon(getColorByKey(app, 'primary')),
      scale: iconScale,
    },
    fill: {
      color: 'rgba(237, 237, 237, 0.1)',
    },
    stroke: {
      color: getColorByKey(app, 'primary'),
      width: 5,
    },
  });
  layer.setStyle(style);

  function setIconColor(): void {
    const color = getColorByKey(app, 'primary');
    style.stroke?.setColor(color);
    style.image = new Icon({ ...getColoredMapIcon(color), scale: iconScale });
    layer.forceRedraw().catch(() => {});
  }

  const themChangedListener = app.themeChanged.addEventListener(setIconColor);

  const destroy = (): void => {
    layer.deactivate();
    app.layers.remove(layer);
    layer.destroy();
    themChangedListener();
  };

  return { layer, destroy };
}

/** Retrieves features from an OpenLayers map at a given pixel. */
function getFeaturesFromOlMap(
  map: OLMap,
  pixel: [number, number],
  hitTolerance: number,
  drill: number,
): Feature[] {
  const features: Feature[] = [];
  let i = 0;
  map.forEachFeatureAtPixel(
    pixel,
    (feat) => {
      if (
        feat &&
        (feat.get('olcs_allowPicking') == null ||
          feat.get('olcs_allowPicking') === true)
      ) {
        const feature = ((feat as Feature)[originalFeatureSymbol] ||
          feat) as Feature;
        if (!feature[vectorClusterGroupName]) {
          features.push(feature);
        }
      }
      i += 1;
      return i >= drill;
    },
    { hitTolerance },
  );

  return features;
}

/** Retrieves features from a Cesium scene at a given window position. */
async function getFeaturesFromScene(
  scene: Scene,
  ray: Ray,
  drill: number,
): Promise<{ features: EventFeature[]; minZ: number }> {
  const { depthTestAgainstTerrain } = scene.globe;
  scene.globe.depthTestAgainstTerrain = false;

  let minZ = 0;
  const objects = await scene.drillPickFromRay(ray, drill);

  scene.globe.depthTestAgainstTerrain = depthTestAgainstTerrain;

  const features = Array.from(
    new Set(
      objects.flatMap(({ object, position }): EventFeature[] => {
        if (object) {
          if (position) {
            const z = cartesianToMercator(position)[2];
            minZ = Math.min(minZ, z);
          }

          const feature = getFeatureFromPickObject(object);
          if (feature) {
            if ((feature as Feature)[vectorClusterGroupName]) {
              const clusterFeatures = (feature as Feature).get('features') as
                | EventFeature[]
                | undefined;
              return clusterFeatures ?? [];
            }
            return [feature];
          }
        }
        return [];
      }),
    ),
  );
  return { features, minZ };
}

async function getDeepPickingFeatures(
  event: InteractionEvent,
  hitTolerance = 10,
  drillLimit = Infinity,
): Promise<{ features: EventFeature[]; minZ: number }> {
  let features: EventFeature[] = [];
  let minZ = 0;
  if (
    event.map.className === 'OpenlayersMap' ||
    event.map.className === 'ObliqueMap'
  ) {
    features = getFeaturesFromOlMap(
      (event.map as OpenlayersMap | ObliqueMap).olMap!,
      [event.windowPosition.x, event.windowPosition.y],
      hitTolerance,
      drillLimit,
    );
  } else if (event.map.className === 'CesiumMap') {
    const cesiumMap = event.map as CesiumMap;
    const scene = cesiumMap.getScene();

    if (!scene) {
      return { features, minZ };
    }

    const [x, y, z] = event.position!;
    const origin = mercatorToCartesian([
      x,
      y,
      Number.isNaN(z) ? pickingZOffset : z + pickingZOffset,
    ]);
    const direction = Cartesian3.normalize(
      Cartesian3.negate(origin, scratchCartesian),
      scratchCartesian,
    );
    const ray = new Ray(origin, direction);

    ({ features, minZ } = await getFeaturesFromScene(scene, ray, drillLimit));
  }

  if (
    event.feature &&
    !(event.feature as Feature)[isProvidedFeature] && // provided features will be provided again.
    !features.includes(event.feature)
  ) {
    features.unshift(event.feature);
  }

  return { features, minZ };
}

async function getInteractionFeatures(
  interaction: AbstractInteraction,
  event: InteractionEvent,
): Promise<EventFeature[]> {
  const pipedEvent = await interaction.pipe({
    ...event,
    feature: undefined,
  });
  const { feature } = pipedEvent;
  if (feature) {
    if ((feature as Feature)[isProvidedClusterFeature]) {
      return (feature as Feature).get('features');
    }
    return [feature];
  }
  return [];
}

function createCollectFeatures(): {
  collectFeatures: (
    event: InteractionEvent,
  ) => Promise<{ features: EventFeature[]; minZ: number }>;
  destroy: () => void;
} {
  const featureProviderInteraction = new FeatureProviderInteraction();
  return {
    async collectFeatures(event): Promise<{
      features: EventFeature[];
      minZ: number;
    }> {
      const { features: deepPickingFeatures, minZ } =
        await getDeepPickingFeatures(event);
      return {
        features: [
          ...deepPickingFeatures,
          ...(await getInteractionFeatures(featureProviderInteraction, event)),
        ],
        minZ,
      };
    },
    destroy(): void {
      featureProviderInteraction.destroy();
    },
  };
}

function featurePredicate(app: VcsUiApp, f: Feature): boolean {
  // @ts-expect-error symbol not defined in type definition
  if (f[featureInfoViewSymbol]) {
    return true;
  }

  const l = app.layers.getByKey(f[vcsLayerName]);
  if (l?.[moduleIdSymbol] === volatileModuleId) {
    return !!getFeatureInfoViewForFeature(app, f);
  }

  return !!l;
}

export function createDeepPickingAction(
  app: VcsUiApp,
  layer: VectorLayer,
  collectFeatures: (
    event: InteractionEvent,
  ) => Promise<{ features: EventFeature[]; minZ: number }>,
  event: InteractionEvent,
): VcsAction {
  return {
    name: 'featureInfo.deepPicking.title',
    icon: '$vcsInfo',
    async callback(): Promise<void> {
      const { features, minZ } = await collectFeatures(event);
      const { items, groups } = getGroupedFeatureList(
        app,
        features.filter((f) => featurePredicate(app, f as Feature)),
        event.position,
        () => {
          app.windowManager.remove(deepPickingWindowId);
        },
      );

      if (app.windowManager.has(deepPickingWindowId)) {
        app.windowManager.remove(deepPickingWindowId);
      }

      app.windowManager.add(
        {
          id: deepPickingWindowId,
          component: ClusterFeatureComponent,
          props: { items, groups },
          state: {
            headerTitle: 'featureInfo.deepPicking.headerTitle',
            headerIcon: '$vcsInfo',
          },
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        vcsAppSymbol,
      );

      const windowListener = app.windowManager.removed.addEventListener(
        ({ id: windowId }) => {
          if (windowId === deepPickingWindowId) {
            layer.removeAllFeatures();
            windowListener();
          }
        },
      );

      const [x, y, z] = event.position!;
      const coordinate = [
        x,
        y,
        Number.isNaN(z) ? pickingZOffset : z + pickingZOffset,
      ];
      const pickFeature = new Feature({
        geometry: new Point(coordinate),
      });
      const rayFeature = new Feature({
        geometry: new LineString([coordinate, [x, y, minZ]]),
      });
      layer.addFeatures([pickFeature, rayFeature]);
    },
  };
}

/** This adds deep picking action to the context menu, if not disabled in uiConfig */
export function setupDeepPicking(app: VcsUiApp): () => void {
  const { layer, destroy: destroyLayer } = setupDeepPickingLayer(app);
  const { collectFeatures, destroy: destroyCollectFeatures } =
    createCollectFeatures();

  const handler = (event: InteractionEvent): VcsAction[] => {
    if (event.windowPosition) {
      return [createDeepPickingAction(app, layer, collectFeatures, event)];
    }
    return [];
  };

  if (app.uiConfig.config.enableDeepPicking !== false) {
    app.contextMenuManager.addEventHandler(handler, vcsAppSymbol);
  }

  const stopWatching = watch(
    () => app.uiConfig.config.enableDeepPicking,
    (value, oldValue) => {
      if (value !== false) {
        if (!(oldValue !== false)) {
          app.contextMenuManager.addEventHandler(handler, vcsAppSymbol);
        }
      } else {
        app.contextMenuManager.removeHandler(handler);
      }
    },
  );

  return (): void => {
    stopWatching();
    destroyLayer();
    destroyCollectFeatures();
    layer.deactivate();
    layer.destroy();
    app.layers.remove(layer);
  };
}
