import { markVolatile, VectorLayer, wgs84Projection } from '@vcmap/core';
import { WindowSlot, createToggleAction, ButtonLocation } from '@vcmap/ui';
import packageJSON from '../package.json';
import component from './VectorPropertiesExample.vue';
import {
  getCircleFeature,
  getLineStringFeature,
  getModelFeature,
  getPointFeature,
  getPolygonFeature,
  getPrimitiveFeature,
} from './lib.js';

export default function createVectorPropertiesExamplePlugin() {
  const layer = new VectorLayer({
    zIndex: 10,
    name: 'vectorPropertiesExampleLayer',
    projection: wgs84Projection.toJSON(),
  });
  markVolatile(layer);

  return {
    get name() {
      return packageJSON.name;
    },
    get version() {
      return packageJSON.version;
    },
    get mapVersion() {
      return packageJSON.mapVersion;
    },
    get layer() {
      return layer;
    },
    initialize(vcsApp) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Vector Properties Example',
        },
        {
          id: 'vector-properties-example',
          state: {
            headerTitle: 'Vector Properties Example',
          },
          component,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        vcsApp.windowManager,
        packageJSON.name,
      );
      vcsApp.navbarManager.add(
        { id: 'vectorProperties', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      vcsApp.layers.add(layer);
      layer.addFeatures([
        getPrimitiveFeature(),
        getModelFeature(),
        getCircleFeature(),
        getPointFeature(),
        getLineStringFeature(),
        getPolygonFeature(),
      ]);
      this.destroy = () => {
        destroy();
        layer.deactivate();
        vcsApp.layers.remove(layer);
        layer.destroy();
      };
    },
  };
}
