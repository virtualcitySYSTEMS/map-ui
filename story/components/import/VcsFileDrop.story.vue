<script setup>
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsFileDrop from '../../../src/components/import/VcsFileDrop.vue';

  const state = getStoryState();
</script>

<template>
  <Story title="VcsFileDrop" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsFileDrop v-bind="{ ...state.bind }" />
    <template #controls>
      <GlobalControls v-model="state"></GlobalControls>
    </template>
  </Story>
</template>
