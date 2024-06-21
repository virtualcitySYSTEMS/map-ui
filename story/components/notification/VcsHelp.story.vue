<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsHelp from '../../../src/components/notification/VcsHelp.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState(undefined, 'row');
  const show = ref(true);
  const helpText = ref('Some help text');
</script>

<template>
  <Story
    title="VcsHelp"
    :meta="{ wrapper: { ...state.wrapper } }"
    :layout="{ type: 'grid', width: '100%' }"
  >
    <Variant title="Text">
      <VcsHelp v-bind="{ ...state.bind }" :text="helpText" :show="show" />
      <template #controls>
        <GlobalControls v-model="state"></GlobalControls>
      </template>
    </Variant>
    <Variant title="HTML">
      <VcsHelp v-bind="{ ...state.bind }" :show="show">
        <ol>
          <li>First help note</li>
          <li>Second help note</li>
          <li>Third help note</li>
        </ol>
      </VcsHelp>
      <template #controls>
        <GlobalControls v-model="state"></GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
