<script setup>
  import { getStoryState } from '../../setup.js';
  import VcsToolButton from '../../../src/components/buttons/VcsToolButton.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState('$vcs3d', 'row');
</script>

<template>
  <Story
    title="Buttons/VcsToolButton"
    :meta="{ wrapper: { ...state.wrapper } }"
  >
    <VcsToolButton :icon="state.icon" v-bind="{ ...state.bind }">
    </VcsToolButton>
    <template #controls>
      <GlobalControls v-model="state" with-icon></GlobalControls>
    </template>
  </Story>
</template>
