<script setup>
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsImportComponent from '../../../src/components/import/VcsImportComponent.vue';

  const state = getStoryState();

  function importFiles(files) {
    if (files) {
      const names = Array.isArray(files)
        ? files.map(({ name }) => name)
        : files.name;
      // eslint-disable-next-line no-alert
      alert(`Called import callback for file(s): ${names}`);
    }
  }
</script>

<template>
  <Story title="VcsImportComponent" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsImportComponent
      :import-files="importFiles"
      v-bind="{ ...state.bind }"
    />
    <template #controls>
      <GlobalControls v-model="state"></GlobalControls>
    </template>
  </Story>
</template>
