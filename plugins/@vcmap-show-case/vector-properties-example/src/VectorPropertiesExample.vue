<template>
  <v-sheet>
    <v-container>
      <v-row>
        <v-col>
          <VcsList
            :items="propertiesToSelectFrom"
            :selectable="true"
            v-model="propertiesSelected"
            title="Select all"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsCheckbox v-model="hideDividers" label="Hide dividers" />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsCheckbox v-model="expandable" label="Expandable" />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsCheckbox
            v-model="showReset"
            label="Show reset vector properties"
          />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsFormButton @click="() => console.log({ ...featureProperties })"
            >Log VectorProperties</VcsFormButton
          >
        </v-col>
      </v-row>
    </v-container>
    <VcsVectorPropertiesComponent
      v-model="featureProperties"
      :value-default="defaultOptions"
      :show3-d-properties="is3D"
      :properties="properties"
      :show-dividers="!hideDividers"
      :expandable="expandable"
      :show-reset="showReset"
    />
  </v-sheet>
</template>

<script>
  import {
    computed,
    inject,
    onMounted,
    onUnmounted,
    reactive,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import { CesiumMap, VectorLayer, VectorProperties } from '@vcmap/core';
  import {
    VcsVectorPropertiesComponent,
    VcsList,
    VcsCheckbox,
    VcsFormButton,
  } from '@vcmap/ui';
  import { VSheet, VContainer, VRow, VCol } from 'vuetify/components';
  import { Feature } from 'ol';
  import { Polygon } from 'ol/geom.js';

  export const polygonCoords = [
    [
      [13.37302869387225, 52.515969833848686, 34.5146781549614],
      [13.374380945328324, 52.51418689937603, 33.692166432214975],
      [13.376569529360477, 52.516925129014055, 34.36842554294618],
      [13.37302869387225, 52.515969833848686, 34.5146781549614],
    ],
  ];

  export default {
    name: 'VectorPropertiesExample',
    components: {
      VcsVectorPropertiesComponent,
      VcsList,
      VcsCheckbox,
      VcsFormButton,
      VSheet,
      VContainer,
      VRow,
      VCol,
    },
    setup() {
      /** @type {import('@vcmap/core').VcsApp} */
      const vcsApp = inject('vcsApp');
      const is3D = ref(false);

      function updateIs3D() {
        is3D.value = vcsApp.maps.activeMap instanceof CesiumMap;
      }
      const mapActivatedListener =
        vcsApp.maps.mapActivated.addEventListener(updateIs3D);
      updateIs3D();

      const feature = new Feature({
        geometry: new Polygon(polygonCoords),
      });
      const layer = new VectorLayer({
        name: 'vectorPropertiesExampleLayer',
        projection: {
          epsg: 'EPSG:4326',
        },
      });

      const featureProperties = shallowRef(
        layer.vectorProperties.getValuesForFeatures([feature]),
      );
      featureProperties.value.scaleByDistance = [0, 1, 100, 0];
      watch(featureProperties, () => {
        layer.vectorProperties.setValuesForFeatures(featureProperties.value, [
          feature,
        ]);
      });

      const defaultOptions = VectorProperties.getDefaultOptions();
      const propertiesToSelectFrom = reactive(
        Object.keys(defaultOptions).map((key) => ({
          name: key,
          title: key,
        })),
      );
      const propertiesSelected = shallowRef([...propertiesToSelectFrom]);

      onMounted(() => {
        vcsApp.layers.add(layer);
        layer.addFeatures([feature]);
        layer.activate();
      });

      onUnmounted(() => {
        layer.deactivate();
        vcsApp.layers.remove(layer);
        layer.destroy();
        mapActivatedListener();
      });
      return {
        featureProperties,
        defaultOptions,
        is3D,
        propertiesToSelectFrom,
        propertiesSelected,
        properties: computed(() =>
          propertiesSelected.value.map(({ name }) => name),
        ),
        hideDividers: ref(false),
        expandable: ref(false),
        showReset: ref(true),
      };
    },
  };
</script>
