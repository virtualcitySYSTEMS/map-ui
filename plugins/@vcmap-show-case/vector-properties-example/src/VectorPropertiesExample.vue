<template>
  <v-sheet>
    <VcsFormSection heading="Input Settings" expandable>
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
    </VcsFormSection>
    <terrain-settings />
    <geometry-settings :feature-properties="featureProperties" />
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
  import { CesiumMap, VectorProperties } from '@vcmap/core';
  import {
    VcsVectorPropertiesComponent,
    VcsList,
    VcsCheckbox,
    VcsFormButton,
    VcsFormSection,
  } from '@vcmap/ui';
  import { VSheet, VContainer, VRow, VCol } from 'vuetify/components';
  import { name } from '../package.json';
  import GeometrySettings from './GeometrySettings.vue';
  import TerrainSettings from './TerrainSettings.vue';

  export default {
    name: 'VectorPropertiesExample',
    components: {
      TerrainSettings,
      GeometrySettings,
      VcsVectorPropertiesComponent,
      VcsList,
      VcsCheckbox,
      VcsFormButton,
      VcsFormSection,
      VSheet,
      VContainer,
      VRow,
      VCol,
    },
    setup() {
      /** @type {import('@vcmap/ui').VcsUiApp} */
      const vcsApp = inject('vcsApp');
      const is3D = ref(false);

      function updateIs3D() {
        is3D.value = vcsApp.maps.activeMap instanceof CesiumMap;
      }
      const mapActivatedListener =
        vcsApp.maps.mapActivated.addEventListener(updateIs3D);
      updateIs3D();

      const { layer } = vcsApp.plugins.getByKey(name);

      const featureProperties = shallowRef(
        layer.vectorProperties.getValuesForFeatures(layer.getFeatures()),
      );

      featureProperties.value.scaleByDistance = [0, 0.5, 1000, 1];
      watch(featureProperties, () => {
        layer.vectorProperties.setValuesForFeatures(
          featureProperties.value,
          layer.getFeatures(),
        );
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
        layer.activate();
      });

      onUnmounted(() => {
        layer.deactivate();
        mapActivatedListener();
      });

      return {
        featureProperties,
        defaultOptions,
        is3D,
        propertiesToSelectFrom,
        propertiesSelected,
        properties: computed(() =>
          propertiesSelected.value.map(({ name: n }) => n),
        ),
        hideDividers: ref(false),
        expandable: ref(true),
        showReset: ref(true),
      };
    },
  };
</script>
