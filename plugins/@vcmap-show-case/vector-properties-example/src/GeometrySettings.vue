<script setup>
  import {
    inject,
    computed,
    shallowRef,
    onUnmounted,
    ref,
    onMounted,
    provide,
  } from 'vue';
  import { unByKey } from 'ol/Observable';
  import { Viewpoint, VectorProperties } from '@vcmap/core';
  import { VcsFormSection, VcsFormButton } from '@vcmap/ui';
  import { VContainer, VRow, VCol, VDivider } from 'vuetify/components';
  import { name } from '../package.json';
  import {
    getArrowFeature,
    getCircleFeature,
    getGeometryCollectionFeature,
    getLabelFeature,
    getLineStringFeature,
    getLineStringsFeature,
    getModelFeature,
    getPointFeature,
    getPointsFeature,
    getPolygonFeature,
    getPolygonsFeature,
    getPrimitiveFeature,
    getTiltedLineStringFeature,
    getTiltedPolygonFeature,
  } from './lib.js';
  import LayoutHandler from './LayoutHandler.vue';

  /** @type {import("@vcmap/ui").VcsUiApp} */
  const vcsApp = inject('vcsApp');
  const { layer } = vcsApp.plugins.getByKey(name);
  const features = shallowRef(layer.getFeatures());
  provide('features', features);
  /** @type {import("ol/source").Vector} */
  const source = layer.getSource();

  const props = defineProps({
    featureProperties: {
      type: Object,
      required: true,
    },
  });

  const sourceListeners = [
    source.on('addfeature', ({ feature }) => {
      new VectorProperties({}).setValuesForFeatures(props.featureProperties, [
        feature,
      ]);
      features.value = layer.getFeatures();
    }),
    source.on('removefeature', () => {
      features.value = layer.getFeatures();
    }),
  ];

  const layout = ref('XYZ');

  const primitive = computed({
    get() {
      return features.value.some((f) => f.getId() === 'Primitive');
    },
    set(value) {
      if (value && !primitive.value) {
        layer.addFeatures([getPrimitiveFeature(layout.value)]);
      } else if (primitive.value) {
        source.removeFeature(source.getFeatureById('Primitive'));
      }
    },
  });

  const model = computed({
    get() {
      return features.value.some((f) => f.getId() === 'Model');
    },
    set(value) {
      if (value && !model.value) {
        layer.addFeatures([getModelFeature(layout.value)]);
      } else if (model.value) {
        source.removeFeature(source.getFeatureById('Model'));
      }
    },
  });

  const label = computed({
    get() {
      return features.value.some((f) => f.getId() === 'Label');
    },
    set(value) {
      if (value && !label.value) {
        layer.addFeatures([getLabelFeature(layout.value)]);
      } else if (label.value) {
        source.removeFeature(source.getFeatureById('Label'));
      }
    },
  });

  const arrow = computed({
    get() {
      return features.value.some((f) => f.getId() === 'Arrow');
    },
    set(value) {
      if (value && !arrow.value) {
        layer.addFeatures([getArrowFeature(layout.value)]);
      } else if (arrow.value) {
        source.removeFeature(source.getFeatureById('Arrow'));
      }
    },
  });

  const circle = computed({
    get() {
      return features.value.some((f) => f.getId() === 'Circle');
    },
    set(value) {
      if (value && !circle.value) {
        layer.addFeatures([getCircleFeature(layout.value)]);
      } else if (circle.value) {
        source.removeFeature(source.getFeatureById('Circle'));
      }
    },
  });

  const point = computed({
    get() {
      return features.value.some((f) => f.getId() === 'Point');
    },
    set(value) {
      if (value && !point.value) {
        layer.addFeatures([getPointFeature(layout.value)]);
      } else if (point.value) {
        source.removeFeature(source.getFeatureById('Point'));
      }
    },
  });

  const points = computed({
    get() {
      return features.value.some((f) => f.getId() === 'Points');
    },
    set(value) {
      if (value && !points.value) {
        layer.addFeatures([getPointsFeature(layout.value)]);
      } else if (points.value) {
        source.removeFeature(source.getFeatureById('Points'));
      }
    },
  });

  const lineString = computed({
    get() {
      return features.value.some((f) => f.getId() === 'LineString');
    },
    set(value) {
      if (value && !lineString.value) {
        layer.addFeatures([getLineStringFeature(layout.value)]);
      } else if (lineString.value) {
        source.removeFeature(source.getFeatureById('LineString'));
      }
    },
  });

  const lineStrings = computed({
    get() {
      return features.value.some((f) => f.getId() === 'LineStrings');
    },
    set(value) {
      if (value && !lineStrings.value) {
        layer.addFeatures([getLineStringsFeature(layout.value)]);
      } else if (lineStrings.value) {
        source.removeFeature(source.getFeatureById('LineStrings'));
      }
    },
  });

  const polygon = computed({
    get() {
      return features.value.some((f) => f.getId() === 'Polygon');
    },
    set(value) {
      if (value && !polygon.value) {
        layer.addFeatures([getPolygonFeature(layout.value)]);
      } else if (polygon.value) {
        source.removeFeature(source.getFeatureById('Polygon'));
      }
    },
  });

  const polygons = computed({
    get() {
      return features.value.some((f) => f.getId() === 'Polygons');
    },
    set(value) {
      if (value && !polygons.value) {
        layer.addFeatures([getPolygonsFeature(layout.value)]);
      } else if (polygons.value) {
        source.removeFeature(source.getFeatureById('Polygons'));
      }
    },
  });

  const geometryCollection = computed({
    get() {
      return features.value.some((f) => f.getId() === 'GeometryCollection');
    },
    set(value) {
      if (value && !geometryCollection.value) {
        layer.addFeatures([getGeometryCollectionFeature(layout.value)]);
      } else if (geometryCollection.value) {
        source.removeFeature(source.getFeatureById('GeometryCollection'));
      }
    },
  });

  const tiltedPolygon = computed({
    get() {
      return features.value.some((f) => f.getId() === 'TiltedPolygon');
    },
    set(value) {
      if (value && !geometryCollection.value) {
        layer.addFeatures([getTiltedPolygonFeature(layout.value)]);
      } else if (geometryCollection.value) {
        source.removeFeature(source.getFeatureById('TiltedPolygon'));
      }
    },
  });

  const tiltedLineString = computed({
    get() {
      return features.value.some((f) => f.getId() === 'TiltedLineString');
    },
    set(value) {
      if (value && !geometryCollection.value) {
        layer.addFeatures([getTiltedLineStringFeature(layout.value)]);
      } else if (geometryCollection.value) {
        source.removeFeature(source.getFeatureById('TiltedLineString'));
      }
    },
  });

  const reset = {
    name: 'reset',
    icon: '$vcsReturn',
    callback() {
      layer.removeAllFeatures();
      layer.addFeatures([
        getPrimitiveFeature(),
        getModelFeature(),
        getCircleFeature(),
        getPointFeature(),
        getLineStringFeature(),
        getPolygonFeature(),
      ]);
    },
  };

  const goToDefaultViewpoint = {
    name: 'defaultVP',
    icon: 'mdi-target',
    callback() {
      vcsApp.maps.activeMap.gotoViewpoint(
        new Viewpoint({
          cameraPosition: [
            13.367898854716408, 52.514030248633524, 1546.0176382209434,
          ],
          groundPosition: [
            13.367898854716412, 52.51403023793378, 33.15479339682457,
          ],
          distance: 1512.862844824798,
          heading: 360,
          pitch: -90,
          roll: 0,
        }),
      );
    },
  };

  onMounted(() => {
    goToDefaultViewpoint.callback();
  });

  onUnmounted(() => {
    unByKey(sourceListeners);
  });
</script>

<template>
  <VcsFormSection
    heading="Geometry Settings"
    expandable
    :header-actions="[goToDefaultViewpoint, reset]"
  >
    <v-container class="pa-2">
      <v-row no-gutters>
        <v-col>
          <VcsFormButton
            @click="primitive = !primitive"
            :active="primitive"
            icon="$vcsCone"
          />
        </v-col>
        <v-col>
          <VcsFormButton
            @click="model = !model"
            :active="model"
            icon="mdi-human"
          />
        </v-col>
        <v-col>
          <VcsFormButton
            @click="arrow = !arrow"
            :active="arrow"
            icon="mdi-arrow-left-right"
          />
        </v-col>
        <v-col>
          <VcsFormButton
            @click="label = !label"
            :active="label"
            icon="mdi-text"
          />
        </v-col>
      </v-row>
      <v-divider class="my-2" />
      <v-row no-gutters>
        <v-col>
          <VcsFormButton
            @click="circle = !circle"
            :active="circle"
            icon="$vcsCircle"
          />
        </v-col>
        <v-col>
          <VcsFormButton
            @click="lineString = !lineString"
            :active="lineString"
            icon="$vcsLine"
          />
        </v-col>
        <v-col>
          <VcsFormButton
            @click="polygon = !polygon"
            :active="polygon"
            icon="$vcsTriangle"
          />
        </v-col>
        <v-col>
          <VcsFormButton
            @click="point = !point"
            :active="point"
            icon="$vcsPoint"
          />
        </v-col>
      </v-row>
      <v-divider class="my-2" />
      <v-row no-gutters>
        <v-col>
          <VcsFormButton
            @click="geometryCollection = !geometryCollection"
            :active="geometryCollection"
            icon="$vcsShapes"
          />
        </v-col>
        <v-col>
          <VcsFormButton
            @click="lineStrings = !lineStrings"
            :active="lineStrings"
            icon="$vcsLine"
            >+</VcsFormButton
          >
        </v-col>
        <v-col>
          <VcsFormButton
            @click="polygons = !polygons"
            :active="polygons"
            icon="$vcsTriangle"
            >+</VcsFormButton
          >
        </v-col>
        <v-col>
          <VcsFormButton
            @click="points = !points"
            :active="points"
            icon="$vcsPoint"
            >+</VcsFormButton
          >
        </v-col>
      </v-row>
      <v-divider class="my-2" />
      <v-row no-gutters>
        <v-col></v-col>
        <v-col>
          <VcsFormButton
            @click="tiltedLineString = !tiltedLineString"
            :active="tiltedLineString"
            icon="$vcsLine"
            >/</VcsFormButton
          >
        </v-col>
        <v-col>
          <VcsFormButton
            @click="tiltedPolygon = !tiltedPolygon"
            :active="tiltedPolygon"
            icon="$vcsTriangle"
            >/</VcsFormButton
          >
        </v-col>
        <v-col />
      </v-row>
      <v-divider class="my-2" />
      <LayoutHandler @layout-changed="layout = $event" />
    </v-container>
  </VcsFormSection>
</template>

<style scoped lang="scss"></style>
