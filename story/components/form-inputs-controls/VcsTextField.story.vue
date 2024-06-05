<script setup>
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../GlobalControls.vue';
  import VcsTextField from '../../../src/components/form-inputs-controls/VcsTextField.vue';

  const state = getStoryState();
</script>

<template>
  <Story title="vcsTextField">
    <VcsTextField />
    <template #controls>
      <GlobalControls v-model="state"></GlobalControls>
    </template>
  </Story>
</template>
