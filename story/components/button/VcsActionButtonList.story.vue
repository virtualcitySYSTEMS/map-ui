<script setup>
  import { getStoryState } from '../../setup.js';
  import { createActions } from '../../storyHelper.js';
  import VcsActionButtonList from '../../../src/components/buttons/VcsActionButtonList.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const actions = createActions();
  const state = getStoryState('$vcs3d', 'row');
</script>

<template>
  <Story
    title="Buttons/VcsActionButtonList"
    :meta="{ wrapper: { ...state.wrapper } }"
  >
    <Variant title="VcsButton">
      <VcsActionButtonList
        button="VcsButton"
        :actions="actions"
        v-bind="{ ...state.bind }"
      >
      </VcsActionButtonList>
      <template #controls>
        <GlobalControls v-model="state"></GlobalControls>
      </template>
    </Variant>
    <Variant title="VcsToolButton">
      <VcsActionButtonList
        button="VcsToolButton"
        :actions="actions"
        v-bind="{ ...state.bind }"
      >
      </VcsActionButtonList>
      <template #controls>
        <GlobalControls v-model="state"></GlobalControls>
      </template>
    </Variant>
    <Variant title="VcsFormButton">
      <VcsActionButtonList
        button="VcsFormButton"
        :actions="actions"
        v-bind="{ ...state.bind }"
      >
      </VcsActionButtonList>
      <template #controls>
        <GlobalControls v-model="state"></GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
