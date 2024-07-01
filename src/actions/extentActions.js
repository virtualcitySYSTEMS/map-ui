import { v4 as uuid } from 'uuid';
import {
  Extent,
  GeometryType,
  LayerState,
  markVolatile,
  maxZIndex,
  mercatorProjection,
  startCreateFeatureSession,
  startEditFeaturesSession,
  startEditGeometrySession,
  VectorLayer,
  Viewpoint,
  wgs84Projection,
} from '@vcmap/core';
import { reactive, ref, watch, nextTick } from 'vue';
import { Feature } from 'ol';
import { transformExtent } from 'ol/proj.js';
import { fromExtent } from 'ol/geom/Polygon.js';
import { createOrUpdateFromCoordinates } from 'ol/extent.js';
import { Polygon } from 'ol/geom.js';
import { unByKey } from 'ol/Observable.js';

/**
 * @param {import("@src/vcsUiApp.js").default} app
 * @param {import("vue").ComputedRef<import("@vcmap/core").Extent>|import("vue").Ref<import("@vcmap/core").Extent>} extent
 * @returns {import("./actionHelper.js").VcsAction}
 */
export function createZoomToExtentAction(app, extent) {
  return {
    name: 'components.extent.zoom',
    icon: 'mdi-target',
    active: false,
    callback() {
      const vp = Viewpoint.createViewpointFromExtent(extent.value);
      if (vp) {
        app.maps.activeMap.gotoViewpoint(vp);
      }
    },
  };
}

/**
 * @param {import("@vcmap/core").Layer} layer
 * @param {boolean} disabled
 * @returns {{action: import("./actionHelper.js").VcsAction, destroy: (function(): void)}}
 */
export function createLayerToggleAction(layer, disabled) {
  const action = reactive({
    name: 'components.extent.toggle',
    title: 'components.extent.show',
    icon: '$vcsEye',
    active: false,
    disabled,
    async callback() {
      if (!this.active) {
        await layer.activate();
        this.title = 'components.extent.hide';
      } else {
        layer.deactivate();
        this.title = 'components.extent.show';
      }
    },
  });

  const stateChangedListener = layer.stateChanged.addEventListener((state) => {
    action.active = state === LayerState.ACTIVE;
  });

  return { action, destroy: () => stateChangedListener() };
}

/**
 *
 * @param {import("@src/vcsUiApp.js").default} app
 * @param {import("@vcmap/core").VectorLayer} layer
 * @param {import("vue").ComputedRef<import("@vcmap/core").Extent>|import("vue").Ref<import("@vcmap/core").Extent>} extent
 * @param {string} featureId
 * @param {boolean} disabled
 * @returns {{ action: import("./actionHelper.js").VcsAction, destroy:()=>void}}
 */
export function createExtentFeatureAction(
  app,
  layer,
  extent,
  featureId,
  disabled,
) {
  let session;
  const action = reactive({
    name: 'components.extent.create',
    title: 'components.extent.create',
    icon: '$vcsBoundingBox',
    active: false,
    disabled,
    callback() {
      if (!this.active) {
        this.active = true;
        layer.activate();
        layer.removeFeaturesById([featureId]);
        session = startCreateFeatureSession(app, layer, GeometryType.BBox);
        const listeners = [
          session.creationFinished.addEventListener((f) => {
            if (f) {
              f.setId(featureId);
              const newExtent = transformExtent(
                f.getGeometry().getExtent(),
                mercatorProjection.proj,
                extent.value.projection.epsg,
              );
              extent.value = Object.assign(extent.value, {
                extent: newExtent,
              });
              session.stop();
            }
          }),
          session.stopped.addEventListener(() => {
            this.active = false;
            listeners.forEach((cb) => cb());
          }),
        ];
      } else {
        session?.stop();
        this.active = false;
      }
    },
  });
  return {
    action,
    destroy: () => {
      if (session) {
        session.stop();
        session = null;
      }
    },
  };
}

/**
 * @param {import("ol").Feature<import("ol/geom").Polygon>} feature
 * @param {import("vue").WritableComputedRef<import("@vcmap/core").Extent>} extent
 */
function updateExtentFromFeature(feature, extent) {
  const options = extent.value.toJSON();
  options.coordinates = transformExtent(
    createOrUpdateFromCoordinates(feature.getGeometry().getCoordinates()[0]),
    mercatorProjection.proj,
    extent.value.projection.proj,
  );

  extent.value = new Extent(options);
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").VectorLayer} layer
 * @param {string} featureId
 * @param {import("vue").WritableComputedRef<import("@vcmap/core").Extent>} extent
 * @param {import("vue").Ref<boolean>} suspendFeatureUpdate
 * @returns {{action: import("./actionHelper.js").VcsAction, destroy(): void}}
 */
function setupTranslateAction(
  app,
  layer,
  featureId,
  extent,
  suspendFeatureUpdate,
) {
  let session;
  const action = reactive({
    name: 'components.extent.translate',
    title: 'components.extent.translate',
    icon: 'mdi-axis-arrow',
    active: false,
    async callback() {
      if (session) {
        session.stop();
      } else {
        const feature = layer.getFeatureById(featureId);
        if (feature) {
          const featureListener = feature.getGeometry().on('change', () => {
            suspendFeatureUpdate.value = true;
            updateExtentFromFeature(feature, extent);
            nextTick(() => {
              suspendFeatureUpdate.value = false;
            });
          });
          await layer.activate();
          session = startEditFeaturesSession(app, layer);
          session.stopped.addEventListener(() => {
            action.active = false;
            unByKey(featureListener);
            session = undefined;
          });
          session.setFeatures([feature]);
          action.active = true;
        }
      }
    },
  });

  return {
    action,
    destroy() {
      session?.stop();
    },
  };
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @param {import("@vcmap/core").VectorLayer} layer
 * @param {string} featureId
 * @param {import("vue").WritableComputedRef<import("@vcmap/core").Extent>} extent
 * @param {import("vue").Ref<boolean>} suspendFeatureUpdate
 * @returns {{action: import("./actionHelper.js").VcsAction, destroy(): void}}
 */
function setupVertexAction(
  app,
  layer,
  featureId,
  extent,
  suspendFeatureUpdate,
) {
  let session;
  const action = reactive({
    name: 'components.extent.editVertices',
    title: 'components.extent.editVertices',
    icon: '$vcsEditVertices',
    active: false,
    disabled: false,
    async callback() {
      if (session) {
        session.stop();
      } else {
        const feature = layer.getFeatureById(featureId);
        if (feature) {
          const featureListener = feature.getGeometry().on('change', () => {
            suspendFeatureUpdate.value = true;
            updateExtentFromFeature(feature, extent);
            nextTick(() => {
              suspendFeatureUpdate.value = false;
            });
          });
          await layer.activate();
          session = startEditGeometrySession(app, layer);
          session.stopped.addEventListener(() => {
            action.active = false;
            unByKey(featureListener);
            session = undefined;
          });
          session.setFeature(feature);
          action.active = true;
        }
      }
    },
  });

  return {
    action,
    destroy() {
      session?.stop();
    },
  };
}

/**
 * Synchronizes a feature with an extent
 * @param {import("vue").ComputedRef<import("@vcmap/core").Extent>|import("vue").Ref<import("@vcmap/core").Extent>} extent
 * @param {import("@vcmap/core").VectorLayer} layer
 * @param {string} featureId
 */
function syncExtentFeature(extent, layer, featureId) {
  const extentCoords = [...extent.value.extent];
  // clamp coords for visualization, because at the pole Cesium has issues
  if (extent.value.projection.epsg === wgs84Projection.epsg) {
    extentCoords[1] = Math.max(-89, extentCoords[1]);
    extentCoords[3] = Math.min(89, extentCoords[3]);
  }

  const extentGeometry = fromExtent(extentCoords);
  extentGeometry.transform(
    extent.value.projection.proj,
    mercatorProjection.proj,
  );
  const coordinates = extentGeometry.getCoordinates();
  coordinates[0].forEach((c) => {
    c.push(0);
  });
  coordinates[0].pop();
  if (layer.getFeatureById(featureId).getGeometry()) {
    layer.getFeatureById(featureId).getGeometry().setCoordinates(coordinates);
  } else {
    const geometry = new Polygon(coordinates, 'XYZ');
    geometry.set('_vcsGeomType', GeometryType.BBox);
    layer.getFeatureById(featureId).setGeometry(geometry);
  }
}

/**
 * @param {import("@src/vcsUiApp.js").default} app
 * @param {import("vue").ComputedRef<import("@vcmap/core").Extent>|import("vue").Ref<import("@vcmap/core").Extent>|import("vue").WritableComputedRef<import("@vcmap/core").Extent>} extent
 * @returns {{ actions: Array<import("./actionHelper.js").VcsAction>, destroy: () => void, layer: import("@vcmap/core").VectorLayer, featureId: string }}
 */
export function setupExtentComponentActions(app, extent) {
  const layer = new VectorLayer({
    projection: mercatorProjection.toJSON(),
    zIndex: maxZIndex - 1,
  });
  markVolatile(layer);
  app.layers.add(layer);

  const feature = new Feature();
  const featureId = uuid();
  const suspendFeatureUpdate = ref(false);
  feature.setId(featureId);
  layer.addFeatures([feature]);

  if (extent.value.isValid()) {
    syncExtentFeature(extent, layer, featureId);
  }

  const stopWatching = watch(
    extent,
    () => {
      if (extent.value.isValid() && !suspendFeatureUpdate.value) {
        syncExtentFeature(extent, layer, featureId);
      }
    },
    { deep: true },
  );

  const { action: showExtentAction, destroy: destroyShowExtent } =
    createLayerToggleAction(layer, false);
  const { action: createExtentAction, destroy: destroyCreateExtent } =
    createExtentFeatureAction(app, layer, extent, featureId, false);
  const zoomToExtentAction = createZoomToExtentAction(app, extent);
  zoomToExtentAction.title = 'components.extent.zoom';
  const { action: translateAction, destroy: destroyTranslate } =
    setupTranslateAction(app, layer, featureId, extent, suspendFeatureUpdate);
  const { action: vertexAction, destroy: destroyVertex } = setupVertexAction(
    app,
    layer,
    featureId,
    extent,
    suspendFeatureUpdate,
  );

  return {
    actions: [
      showExtentAction,
      createExtentAction,
      vertexAction,
      translateAction,
      zoomToExtentAction,
    ],
    destroy: () => {
      layer.deactivate();
      app.layers.remove(layer);
      layer.destroy();
      destroyShowExtent();
      destroyCreateExtent();
      destroyTranslate();
      destroyVertex();
      stopWatching();
    },
    layer,
    featureId,
  };
}
