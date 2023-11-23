import { v4 as uuid } from 'uuid';
import {
  GeometryType,
  LayerState,
  markVolatile,
  maxZIndex,
  mercatorProjection,
  startCreateFeatureSession,
  VectorLayer,
  Viewpoint,
} from '@vcmap/core';
import { reactive, watch } from 'vue';
import { Feature } from 'ol';
import { transformExtent } from 'ol/proj.js';
import { fromExtent } from 'ol/geom/Polygon.js';

/**
 * @param {VcsUiApp} app
 * @param {import("vue").ComputedRef<import("@vcmap/core").Extent>} extent
 * @returns {{name: string, icon: string, active: boolean, callback(): void}}
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
 * @returns {{action: VcsAction, destroy: (function(): void)}}
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
 * @param {VcsUiApp} app
 * @param {import("@vcmap/core").VectorLayer} layer
 * @param {import("vue").ComputedRef<import("@vcmap/core").Extent>} extent
 * @param {string} featureId
 * @param {boolean} disabled
 * @returns {{ action:VcsAction, destroy:()=>void}}
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
 * Synchronizes a feature with an extent
 * @param {import("vue").ComputedRef<import("@vcmap/core").Extent>} extent
 * @param {import("@vcmap/core").VectorLayer} layer
 * @param {string} featureId
 */
function syncExtentFeature(extent, layer, featureId) {
  const geometry = fromExtent(extent.value.extent);
  geometry.transform(extent.value.projection.proj, mercatorProjection.proj);
  geometry.set('_vcsGeomType', GeometryType.BBox);
  layer.getFeatureById(featureId).setGeometry(geometry);
}

/**
 * @param {VcsUiApp} app
 * @param {import("vue").ComputedRef<import("@vcmap/core").Extent>} extent
 * @param {boolean} disabled
 * @returns {{actions: Array<VcsAction>, destroy: () => void}}
 */
export function setupExtentComponentActions(app, extent, disabled) {
  const layer = new VectorLayer({
    projection: mercatorProjection.toJSON(),
    zIndex: maxZIndex - 1,
  });
  markVolatile(layer);
  app.layers.add(layer);

  const feature = new Feature();
  const featureId = uuid();
  feature.setId(featureId);
  layer.addFeatures([feature]);

  if (extent.value.isValid()) {
    syncExtentFeature(extent, layer, featureId);
  }

  const stopWatching = watch(
    extent,
    () => {
      if (extent.value.isValid()) {
        syncExtentFeature(extent, layer, featureId);
        if (layer.projection.epsg !== extent.value.projection.epsg) {
          layer.projection = extent.value.projection;
        }
      }
    },
    { deep: true },
  );

  const { action: showExtentAction, destroy: destroyShowExtent } =
    createLayerToggleAction(layer, disabled);
  const { action: createExtentAction, destroy: destroyCreateExtent } =
    createExtentFeatureAction(app, layer, extent, featureId, disabled);
  const zoomToExtentAction = createZoomToExtentAction(app, extent);

  return {
    actions: [showExtentAction, createExtentAction, zoomToExtentAction],
    destroy: () => {
      layer.deactivate();
      app.layers.remove(layer);
      layer.destroy();
      destroyShowExtent();
      destroyCreateExtent();
      stopWatching();
    },
  };
}
