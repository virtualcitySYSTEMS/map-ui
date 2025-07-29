<script setup>
  import { ref, inject, onUnmounted } from 'vue';
  import { PanoramaMap } from '@vcmap/core';
  import { VSheet, VCard } from 'vuetify/components';
  import PanoramaDebugInfo from './PanoramaDebugInfo.vue';
  import PanoramaDebugTools from './PanoramaDebugTools.vue';

  /** @type {VcsUiApp} */
  const app = inject('vcsApp');
  const isPanorama = ref(app.maps.activeMap instanceof PanoramaMap);

  const listener = app.maps.mapActivated.addEventListener((map) => {
    isPanorama.value = map instanceof PanoramaMap;
  });

  onUnmounted(() => {
    listener();
  });
</script>

<template>
  <v-sheet>
    <template v-if="isPanorama">
      <panorama-debug-info />
      <panorama-debug-tools />
    </template>
    <v-card v-else> Switch to panorama map </v-card>
  </v-sheet>
</template>

<style scoped lang="scss"></style>
