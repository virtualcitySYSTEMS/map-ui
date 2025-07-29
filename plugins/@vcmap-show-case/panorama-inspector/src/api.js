import {
  GeometryInstance,
  Material,
  MaterialAppearance,
  Matrix4,
  Primitive,
  SphereGeometry,
  Color,
  Cartesian3,
  Globe,
  ImageryLayer as CesiumImageryLayer,
  OpenStreetMapImageryProvider,
} from '@vcmap-cesium/engine';
import {
  mercatorToCartesian,
  PanoramaMap,
  PanoramaDatasetLayer,
} from '@vcmap/core';
import { reactive, ref, computed, watch } from 'vue';

/**
 * @typedef {Object} ClickedPrimitive
 * @property {boolean} show
 * @property {Cartesian3} position
 * @property {() => void} destroy
 */

/**
 * @param {import("@vcmap/core").PanoramaMap} map
 * @param {ShowClickInteraction} clickedInteraction
 * @returns {ClickedPrimitive}
 */
export function setupClickedPrimitive(map, clickedInteraction) {
  const position = new Cartesian3();
  const appearance = new MaterialAppearance({
    flat: true,
    material: Material.fromType('Color', { color: Color.ORANGERED }),
  });
  const primitive = new Primitive({
    geometryInstances: [
      new GeometryInstance({
        geometry: new SphereGeometry({
          radius: 0.2,
        }),
      }),
    ],
    appearance,
    depthFailAppearance: new MaterialAppearance({
      translucent: true,
      material: Material.fromType('Color', {
        color: Color.LIMEGREEN.withAlpha(0.6),
      }),
    }),
    asynchronous: false,
    show: false,
    modelMatrix: Matrix4.IDENTITY,
  });

  map.getCesiumWidget().scene.primitives.add(primitive);
  clickedInteraction.clicked.addEventListener((event) => {
    mercatorToCartesian(event.position, position);
    primitive.modelMatrix = Matrix4.fromTranslation(position);
  });

  return {
    get show() {
      return primitive.show;
    },
    set show(value) {
      primitive.show = value;
    },
    get position() {
      return position;
    },
    destroy() {
      map.getCesiumWidget().scene.primitives.remove(primitive);
    },
  };
}

/**
 * @param {import("@vcmap/core").VcsApp} app
 * @returns {{ action: import("@vcmap/ui").Action, destroy: () => void }}
 */
export function createOsmGlobeAction(app) {
  /** @type {import("@vcmap/core").PanoramaMap} */
  const map = app.maps.getByType(PanoramaMap.className)[0];

  const action = reactive({
    name: 'OSM Globe',
    icon: 'mdi-earth',
    title: 'Open Street Map Globe',
    active: false,
    callback() {
      if (action.active) {
        map.getCesiumWidget().scene.globe = undefined;
        action.active = false;
      } else {
        const { scene } = map.getCesiumWidget();
        scene.globe = new Globe();
        scene.imageryLayers.add(
          new CesiumImageryLayer(
            new OpenStreetMapImageryProvider({ maximumLevel: 18 }),
          ),
        );
        action.active = true;
      }
    },
  });

  return {
    action,
    destroy: () => {
      if (map.initialized) {
        map.getCesiumWidget().scene.globe = undefined;
      }
    },
  };
}

/**
 * @param {import("@vcmap/core").VcsApp} app
 * @returns {{action: import("@vcmap/ui").VcsAction, destroy(): void}}
 */
export function createMapMarkerAction(app) {
  const hideFootprint = ref(false);

  const hideFootprintWatcher = watch(hideFootprint, () => {
    for (const layer of app.layers) {
      if (layer instanceof PanoramaDatasetLayer) {
        layer.hideInPanorama = hideFootprint.value;
      }
    }
  });

  const layerAdded = app.layers.added.addEventListener((layer) => {
    if (layer instanceof PanoramaDatasetLayer) {
      layer.hideInPanorama = hideFootprint.value;
    }
  });

  const action = reactive({
    name: 'Hide Footprint',
    icon: computed(() => {
      return hideFootprint.value ? 'mdi-map-marker-off' : 'mdi-map-marker';
    }),
    title: 'Hide Footprint',
    active: computed(() => hideFootprint.value),
    callback() {
      hideFootprint.value = !hideFootprint.value;
    },
  });

  return {
    action,
    destroy() {
      hideFootprintWatcher();
      layerAdded();
    },
  };
}
