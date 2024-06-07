<script setup>
  import { getStoryState } from '../../setup.js';
  import VcsButton from '../../../src/components/buttons/VcsButton.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState('$vcs3d');
</script>

<template>
  <Story title="VcsButton" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsButton :icon="state.icon" />
    <template #controls>
      <GlobalControls v-model="state" with-icon></GlobalControls>
    </template>
  </Story>
</template>
