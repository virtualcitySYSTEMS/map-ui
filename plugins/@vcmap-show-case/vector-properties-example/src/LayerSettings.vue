<script setup>
  import { computed, inject, ref } from 'vue';
  import { VcsFormSection, VcsCheckbox } from '@vcmap/ui';
  import { VContainer, VRow, VCol } from 'vuetify/components';
  import { name } from '../package.json';
  import { getBalloonFeatureInfo } from './lib.js';

  const vcsApp = inject('vcsApp');
  const plugin = vcsApp.plugins.getByKey(name);

  const { layer } = plugin;
  const featureInfo = getBalloonFeatureInfo(vcsApp);
  const hasBalloon = ref(layer.properties.featureInfo === featureInfo.name);
  const useBalloon = computed({
    get: () => hasBalloon.value,
    set: (value) => {
      if (value) {
        layer.properties.featureInfo = featureInfo.name;
      } else {
        layer.properties.featureInfo = undefined;
      }
      hasBalloon.value = layer.properties.featureInfo === featureInfo.name;
    },
  });
</script>

<template>
  <VcsFormSection heading="Layer Settings" expandable>
    <v-container class="pa-2">
      <v-row no-gutters>
        <v-col>
          <VcsCheckbox v-model="useBalloon" label="Balloon Feature Info" />
        </v-col>
      </v-row>
    </v-container>
  </VcsFormSection>
</template>

<style scoped lang="scss"></style>
