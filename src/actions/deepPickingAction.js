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
import { Point, LineString } from 'ol/geom.js';
import { Icon } from 'ol/style.js';
import { Cartesian3, Ray } from '@vcmap-cesium/engine';
import { watch } from 'vue';
import { getLogger } from '@vcsuite/logger';
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

const scratchCartesian = new Cartesian3();
const pickingZOffset = 10.0;
const iconScale = 1.5;

export const deepPickingWindowId = 'deep-picking-window';

/**
 * @param {import("@vcmap/ui").VcsUiApp} app
 * @returns {{ layer: import("@vcmap/core").VectorLayer, destroy: () => void }}
 */
export function setupDeepPickingLayer(app) {
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

  function setIconColor() {
    const color = getColorByKey(app, 'primary');
    style.stroke?.setColor(color);
    style.image = new Icon({ ...getColoredMapIcon(color), scale: iconScale });
    layer.forceRedraw();
  }

  const themChangedListener = app.themeChanged.addEventListener(setIconColor);

  const destroy = () => {
    layer.deactivate();
    app.layers.remove(layer);
    layer.destroy();
    themChangedListener();
  };

  return { layer, destroy };
}

/**
 * Retrieves features from an OpenLayers map at a given pixel.
 * @param {import("ol/Map.js").OLMap} map
 * @param {[number, number]} pixel
 * @param {number} hitTolerance
 * @param {number} drill
 * @returns {import("ol").Feature[]}
 */
function getFeaturesFromOlMap(map, pixel, hitTolerance, drill) {
  const features = [];
  let i = 0;
  map.forEachFeatureAtPixel(
    pixel,
    (feat) => {
      if (
        feat &&
        (feat.get('olcs_allowPicking') == null ||
          feat.get('olcs_allowPicking') === true)
      ) {
        const feature = feat[originalFeatureSymbol] || feat;
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

/**
 * Retrieves features from a Cesium scene at a given window position.
 * @param {import("@vcmap-cesium/engine").Scene} scene
 * @param {import("@vcmap-cesium/engine").Ray} ray
 * @param {number} drill
 * @returns {Promise<{ features: import("@vcmap/core").EventFeature[], minZ: number }>}
 */
async function getFeaturesFromScene(scene, ray, drill) {
  const { depthTestAgainstTerrain } = scene.globe;
  scene.globe.depthTestAgainstTerrain = false;

  let minZ = 0;
  const objects = await scene.drillPickFromRay(ray, drill);

  scene.globe.depthTestAgainstTerrain = depthTestAgainstTerrain;

  const features = objects
    .map(({ object, position }) => {
      let feature;
      if (object) {
        if (position) {
          const z = cartesianToMercator(position)[2];
          minZ = Math.min(minZ, z);
        }
        feature = getFeatureFromPickObject(object);
        if (feature?.[vectorClusterGroupName]) {
          const clusterFeatures = feature.get('features');
          return [...clusterFeatures];
        }
      }
      return feature;
    })
    .filter((f, i, a) => !!f && a.indexOf(f) === i);
  return { features, minZ };
}

/**
 * @param {import("@vcmap/core").InteractionEvent} event
 * @param {number} [hitTolerance=10]
 * @param {number} [drillLimit]
 * @returns {Promise<{ features: import("@vcmap/core").EventFeature[], minZ: number }>}
 */
async function getDeepPickingFeatures(
  event,
  hitTolerance = 10,
  drillLimit = undefined,
) {
  let features = [];
  let minZ = 0;
  if (
    event.map.className === 'OpenlayersMap' ||
    event.map.className === 'ObliqueMap'
  ) {
    features = getFeaturesFromOlMap(
      event.map.olMap,
      [event.windowPosition.x, event.windowPosition.y],
      hitTolerance,
      drillLimit,
    );
  } else if (event.map.className === 'CesiumMap') {
    const cesiumMap = event.map;
    const scene = cesiumMap.getScene();

    if (!scene) {
      return features;
    }

    const [x, y, z] = event.position;
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
    !event.feature[isProvidedFeature] && // provided features will be provided again.
    !features.includes(event.feature)
  ) {
    features.unshift(event.feature);
  }

  return { features, minZ };
}

/**
 * @param {import("@vcmap/core").AbstractInteraction} interaction
 * @param {import("@vcmap/core").InteractionEvent} event
 * @returns {Promise<import("@vcmap/core").EventFeature[]>}
 */
async function getInteractionFeatures(interaction, event) {
  const pipedEvent = await interaction.pipe({
    ...event,
    feature: undefined,
  });
  const { feature } = pipedEvent;
  if (feature) {
    if (feature[isProvidedClusterFeature]) {
      return feature.get('features');
    }
    return [feature];
  }
  return [];
}

/**
 * @returns {{ collectFeatures: (event: import("@vcmap/core").InteractionEvent) => Promise<{ features: import("@vcmap/core").EventFeature[], minZ: number }>, destroy: () => void}}
 */
function createCollectFeatures() {
  const featureProviderInteraction = new FeatureProviderInteraction();
  return {
    async collectFeatures(event) {
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
    destroy() {
      featureProviderInteraction.destroy();
    },
  };
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("ol/Feature").default} f
 * @returns {boolean}
 */
function featurePredicate(app, f) {
  if (f[featureInfoViewSymbol]) {
    return true;
  }

  const l = app.layers.getByKey(f[vcsLayerName]);
  if (l?.[moduleIdSymbol] === volatileModuleId) {
    return !!getFeatureInfoViewForFeature(app, f);
  }

  return !!l;
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").VectorLayer} layer
 * @param {(event: import("@vcmap/core").InteractionEvent) => Promise<import("@vcmap/core").EventFeature[]>} collectFeatures
 * @param {import("@vcmap/core").InteractionEvent} event
 * @returns {import("./actionHelper.js").VcsAction}
 */
export function createDeepPickingAction(app, layer, collectFeatures, event) {
  return {
    name: 'featureInfo.deepPicking.title',
    icon: '$vcsInfo',
    async callback() {
      const { features, minZ } = await collectFeatures(event);
      const { items, groups } = getGroupedFeatureList(
        app,
        features.filter((f) => featurePredicate(app, f)),
        event.position,
      );

      if (app.windowManager.has(deepPickingWindowId)) {
        app.windowManager.remove(deepPickingWindowId);
      }

      app.windowManager.add(
        {
          id: deepPickingWindowId,
          component: ClusterFeatureComponent,
          props: {
            items,
            groups,
          },
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

      const [x, y, z] = event.position;
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

/**
 * This adds deep picking action to the context menu, if not disabled in uiConfig
 * @param {import("../vcsUiApp.js").default} app
 * @returns {() => void}
 */
export function setupDeepPicking(app) {
  const { layer, destroy: destroyLayer } = setupDeepPickingLayer(app);
  const { collectFeatures, destroy: destroyCollectFeatures } =
    createCollectFeatures();

  const handler = async (event) => {
    if (event.windowPosition) {
      return [createDeepPickingAction(app, layer, collectFeatures, event)];
    }
    return [];
  };

  if (app.uiConfig.enableDeepPicking !== false) {
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

  return () => {
    stopWatching();
    destroyLayer();
    destroyCollectFeatures();
    layer.deactivate();
    layer.destroy();
    app.layers.remove(layer);
  };
}
