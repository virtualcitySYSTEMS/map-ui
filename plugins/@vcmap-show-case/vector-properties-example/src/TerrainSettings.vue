<script setup>
  import {
    VcsFormSection,
    LayerContentTreeItem,
    VcsTreeview,
    VcsSlider,
  } from '@vcmap/ui';
  import { VContainer, VRow, VCol, VSwitch } from 'vuetify/components';
  import { inject, onUnmounted, ref, watch } from 'vue';
  /** @type {import("@vcmap/ui").VcsUiApp} */
  const vcsApp = inject('vcsApp');
  const terrainLayerItem = new LayerContentTreeItem(
    {
      name: 'terrain',
      layerName: 'GermanyBaseTerrain',
    },
    vcsApp,
  );

  const meshLayerItem = new LayerContentTreeItem(
    { layerName: 'mesh_surface', name: 'mesh' },
    vcsApp,
  );

  const [cesiumMap] = vcsApp.maps.getByType('CesiumMap');
  const transparency = ref(null);
  const transparencyEnabled = ref(false);

  let initialTransparency = false;
  if (cesiumMap) {
    initialTransparency = cesiumMap.getScene().globe.translucency.enabled;
    transparency.value =
      cesiumMap.getScene().globe.translucency.frontFaceAlpha ?? 1;

    watch(transparency, (value) => {
      cesiumMap.getScene().globe.translucency.frontFaceAlpha = value;
    });

    watch(transparencyEnabled, (value) => {
      cesiumMap.getScene().globe.translucency.enabled = value;
    });
  }

  onUnmounted(() => {
    if (initialTransparency != null) {
      cesiumMap.getScene().globe.translucency.enabled = initialTransparency;
    }
  });
</script>

<template>
  <vcs-form-section heading="Terrain Settings" expandable>
    <v-container class="pa-2">
      <v-row no-gutters>
        <v-col>
          <vcs-treeview
            :items="[
              terrainLayerItem.getTreeViewItem(),
              meshLayerItem.getTreeViewItem(),
            ]"
            item-children="visibleChildren"
          ></vcs-treeview>
        </v-col>
      </v-row>
      <template v-if="transparency !== null">
        <v-row class="pa-4"> Globe Transparency </v-row>
        <v-row no-gutters class="d-flex align-content-space-between">
          <v-col cols="2" class="pl-2">
            <v-switch v-model="transparencyEnabled" />
          </v-col>
          <v-col>
            <vcs-slider
              :disabled="!transparencyEnabled"
              :step="0.01"
              type="number"
              :min="0"
              max="1"
              v-model="transparency"
            />
          </v-col>
          <v-col cols="2" class="pl-2">
            {{ transparency }}
          </v-col>
        </v-row>
      </template>
    </v-container>
  </vcs-form-section>
</template>

<style scoped lang="scss"></style>
