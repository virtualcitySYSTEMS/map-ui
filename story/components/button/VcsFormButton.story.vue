<script setup>
  import { getStoryState } from '../../setup.js';
  import VcsFormButton from '../../../src/components/buttons/VcsFormButton.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState('$vcs3d', 'row');
</script>

<template>
  <Story
    title="Buttons/VcsFormButton"
    :meta="{ wrapper: { ...state.wrapper } }"
  >
    <Variant title="Outlined">
      <VcsFormButton
        :icon="state.icon"
        variant="outlined"
        v-bind="{ ...state.bind }"
      >
        Button
      </VcsFormButton>
      <template #controls>
        <GlobalControls v-model="state" with-icon></GlobalControls>
      </template>
    </Variant>
    <Variant title="Filled">
      <VcsFormButton
        :icon="state.icon"
        variant="filled"
        v-bind="{ ...state.bind }"
      >
        continue
      </VcsFormButton>
      <template #controls>
        <GlobalControls v-model="state" with-icon></GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
