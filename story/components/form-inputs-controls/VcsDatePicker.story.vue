<script setup>
  import { getStoryState } from '../../setup.js';
  import VcsDatePicker from '../../../src/components/form-inputs-controls/VcsDatePicker.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState();
</script>

<template>
  <Story title="VcsDatePicker" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsDatePicker v-bind="{ ...state.bind }" />
    <template #controls>
      <GlobalControls v-model="state"> </GlobalControls>
    </template>
  </Story>
</template>
