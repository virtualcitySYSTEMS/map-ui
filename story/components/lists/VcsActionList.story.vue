<script setup>
  import { getStoryState } from '../../setup.js';
  import { createActions } from '../../storyHelper.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsActionList from '../../../src/components/lists/VcsActionList.vue';

  const actions = createActions();
  const state = getStoryState('$vcs3d');
</script>

<template>
  <Story title="VcsActionList" :meta="{ wrapper: { type: 'window' } }">
    <VcsActionList :actions="actions" />
    <template #controls>
      <GlobalControls v-model="state" with-icon></GlobalControls>
    </template>
  </Story>
</template>
