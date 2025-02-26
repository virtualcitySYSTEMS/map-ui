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
  const hasBallon = ref(layer.properties.featureInfo === featureInfo.name);
  const useBallon = computed({
    get: () => hasBallon.value,
    set: (value) => {
      if (value) {
        layer.properties.featureInfo = featureInfo.name;
      } else {
        layer.properties.featureInfo = undefined;
      }
      hasBallon.value = layer.properties.featureInfo === featureInfo.name;
    },
  });
</script>

<template>
  <vcs-form-section heading="Layer Settings" expandable>
    <v-container class="pa-2">
      <v-row no-gutters>
        <v-col>
          <vcs-checkbox v-model="useBallon" label="Ballon Feature Info" />
        </v-col>
      </v-row>
    </v-container>
  </vcs-form-section>
</template>

<style scoped lang="scss"></style>
