<script setup>
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../GlobalControls.vue';
  import VcsButton from '../../../src/components/buttons/VcsButton.vue';

  const state = getStoryState('$vcs3d');
</script>

<template>
  <Story title="vcsButton">
    <VcsButton :icon="state.icon" />
    <template #controls>
      <GlobalControls v-model="state" with-icon></GlobalControls>
    </template>
  </Story>
</template>
