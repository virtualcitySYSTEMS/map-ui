<script setup>
  import { getStoryState } from '../../setup.js';
  import VcsTextField from '../../../src/components/form-inputs-controls/VcsTextField.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState();
</script>

<template>
  <Story title="VcsTextField" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsTextField />
    <template #controls>
      <GlobalControls v-model="state"></GlobalControls>
    </template>
  </Story>
</template>
