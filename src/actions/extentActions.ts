import { v4 as uuid } from 'uuid';
import type {
  CreateFeatureSession,
  EditFeaturesSession,
  EditGeometrySession,
  Layer,
} from '@vcmap/core';
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
import type { ComputedRef, Ref, WritableComputedRef } from 'vue';
import { reactive, ref, watch, nextTick } from 'vue';
import { Feature } from 'ol';
import { transformExtent } from 'ol/proj.js';
import { fromExtent } from 'ol/geom/Polygon.js';
import { createOrUpdateFromCoordinates } from 'ol/extent.js';
import { Polygon } from 'ol/geom.js';
import { unByKey } from 'ol/Observable.js';
import { getLogger } from '@vcsuite/logger';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsAction, DestroyableAction } from './actionHelper.js';
import { callSafeAction } from './actionHelper.js';

export function createZoomToExtentAction(
  app: VcsUiApp,
  extent: ComputedRef<Extent> | Ref<Extent>,
): VcsAction {
  return {
    name: 'components.extent.zoom',
    icon: 'mdi-target',
    active: false,
    async callback(): Promise<void> {
      const vp = Viewpoint.createViewpointFromExtent(extent.value);
      if (vp) {
        await app.maps.activeMap?.gotoViewpoint(vp);
      }
    },
  };
}

export function createLayerToggleAction(
  layer: Layer,
  disabled: boolean,
): DestroyableAction {
  const action = reactive({
    name: 'components.extent.toggle',
    title: 'components.extent.show',
    icon: '$vcsEye',
    active: false,
    disabled,
    callback(): void {
      if (!this.active) {
        layer.activate().catch(() => {
          getLogger('extentActions').warning('Failed to activate layer');
          this.title = 'components.extent.show';
        });
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

  return {
    action,
    destroy: (): void => {
      stateChangedListener();
    },
  };
}

export function createExtentFeatureAction(
  app: VcsUiApp,
  layer: VectorLayer,
  extent: WritableComputedRef<Extent> | Ref<Extent>,
  featureId: string,
  disabled: boolean,
): DestroyableAction {
  let session: CreateFeatureSession<GeometryType> | null = null;
  const action = reactive({
    name: 'components.extent.create',
    title: 'components.extent.create',
    icon: '$vcsBoundingBox',
    active: false,
    disabled,
    callback(): void {
      if (!this.active) {
        this.active = true;
        layer.activate().catch(() => {
          getLogger('extentActions').warning('Failed to activate layer');
          session?.stop();
          this.active = false;
        });
        const feature = layer.getFeatureById(featureId);
        layer.removeFeaturesById([featureId]);
        session = startCreateFeatureSession(app, layer, GeometryType.BBox);
        const listeners = [
          session.creationFinished.addEventListener((f) => {
            if (f) {
              f.setId(featureId);
              const newExtent = transformExtent(
                f.getGeometry()!.getExtent(),
                mercatorProjection.proj,
                extent.value.projection.epsg,
              );
              const options = extent.value.toJSON();
              options.coordinates = newExtent;
              extent.value = new Extent(options);
              session?.stop();
            } else if (feature) {
              // reset feature, if creation is canceled
              layer.addFeatures([feature]);
            }
          }),
          session.stopped.addEventListener((): void => {
            this.active = false;
            listeners.forEach((cb) => {
              cb();
            });
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
    destroy: (): void => {
      if (session) {
        session.stop();
        session = null;
      }
    },
  };
}

export function createResetExtentAction(
  extent: WritableComputedRef<Extent> | Ref<Extent>,
  initialExtent: Extent,
): VcsAction {
  return {
    name: 'components.extent.reset',
    title: 'components.extent.reset',
    icon: '$vcsReturn',
    active: false,
    callback(): void {
      extent.value = initialExtent.clone();
    },
  };
}

function updateExtentFromFeature(
  feature: Feature<Polygon>,
  extent: WritableComputedRef<Extent> | Ref<Extent>,
): void {
  const options = extent.value.toJSON();
  options.coordinates = transformExtent(
    createOrUpdateFromCoordinates(feature.getGeometry()!.getCoordinates()[0]),
    mercatorProjection.proj,
    extent.value.projection.proj,
  );

  extent.value = new Extent(options);
}

function setupTranslateAction(
  app: VcsUiApp,
  layer: VectorLayer,
  featureId: string,
  extent: WritableComputedRef<Extent> | Ref<Extent>,
  suspendFeatureUpdate: Ref<boolean>,
): DestroyableAction {
  let session: EditFeaturesSession | undefined;
  const action = reactive({
    name: 'components.extent.translate',
    title: 'components.extent.translate',
    icon: 'mdi-axis-arrow',
    active: false,
    callback(): void {
      if (session) {
        session.stop();
      } else {
        const feature = layer.getFeatureById(featureId) as Feature<Polygon>;
        if (feature) {
          const featureListener = feature.getGeometry()?.on('change', () => {
            suspendFeatureUpdate.value = true;
            updateExtentFromFeature(feature, extent);
            nextTick(() => {
              suspendFeatureUpdate.value = false;
            }).catch(() => {});
          });
          layer.activate().catch(() => {
            getLogger('extentActions').warning('Failed to activate layer');
            session?.stop();
          });
          session = startEditFeaturesSession(app, layer);
          session.stopped.addEventListener((): void => {
            action.active = false;
            if (featureListener) {
              unByKey(featureListener);
            }
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
    destroy(): void {
      session?.stop();
    },
  };
}

function setupVertexAction(
  app: VcsUiApp,
  layer: VectorLayer,
  featureId: string,
  extent: WritableComputedRef<Extent> | Ref<Extent>,
  suspendFeatureUpdate: Ref<boolean>,
): DestroyableAction {
  let session: EditGeometrySession | undefined;
  const action = reactive({
    name: 'components.extent.editVertices',
    title: 'components.extent.editVertices',
    icon: '$vcsEditVertices',
    active: false,
    disabled: false,
    callback(): void {
      if (session) {
        session.stop();
      } else {
        const feature = layer.getFeatureById(featureId) as Feature<Polygon>;
        if (feature) {
          const featureListener = feature.getGeometry()?.on('change', () => {
            suspendFeatureUpdate.value = true;
            updateExtentFromFeature(feature, extent);
            nextTick(() => {
              suspendFeatureUpdate.value = false;
            }).catch(() => {});
          });
          layer.activate().catch(() => {
            getLogger('extentActions').warning('Failed to activate layer');
            session?.stop();
          });
          session = startEditGeometrySession(app, layer);
          session.stopped.addEventListener(() => {
            action.active = false;
            if (featureListener) {
              unByKey(featureListener);
            }
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
    destroy(): void {
      session?.stop();
    },
  };
}

/** Synchronizes a feature with an extent */
function syncExtentFeature(
  extent: ComputedRef<Extent> | Ref<Extent>,
  layer: VectorLayer,
  featureId: string,
): void {
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
  const feature = layer.getFeatureById(featureId);
  if (feature?.getGeometry()) {
    feature.getGeometry()!.setCoordinates(coordinates);
  } else {
    const geometry = new Polygon(coordinates, 'XYZ');
    geometry.set('_vcsGeomType', GeometryType.BBox);
    feature?.setGeometry(geometry);
  }
}

export function setupExtentComponentActions(
  app: VcsUiApp,
  extent: ComputedRef<Extent> | Ref<Extent> | WritableComputedRef<Extent>,
  showExtentOnStartup = false,
): {
  actions: Array<VcsAction>;
  destroy: () => void;
  layer: VectorLayer;
  featureId: string;
} {
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
  const resetExtentAction = createResetExtentAction(
    extent,
    extent.value.clone(),
  );
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
  if (showExtentOnStartup) {
    callSafeAction(showExtentAction);
  }

  return {
    actions: [
      showExtentAction,
      createExtentAction,
      resetExtentAction,
      vertexAction,
      translateAction,
      zoomToExtentAction,
    ],
    destroy: (): void => {
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
