<script setup>
  import { getStoryState } from '../../setup.js';
  import VcsButton from '../../../src/components/buttons/VcsButton.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState('$vcs3d', 'row');
</script>

<template>
  <Story title="Buttons/VcsButton" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsButton v-bind="{ ...state.bind }" :icon="state.icon"></VcsButton>
    <template #controls>
      <GlobalControls v-model="state" with-icon></GlobalControls>
    </template>
  </Story>
</template>
