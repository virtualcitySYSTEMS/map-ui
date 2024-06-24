<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsCoordinate from '../../../src/components/form-inputs-controls/VcsCoordinate.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState(undefined, 'row');
  const model = ref([0, 0, 0]);
</script>

<template>
  <Story title="VcsCoordinate" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsCoordinate v-model="model" v-bind="{ ...state.bind }" />
    <template #controls>
      <GlobalControls v-model="state"></GlobalControls>
    </template>
  </Story>
</template>
