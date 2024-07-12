<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsLabel from '../../../src/components/form-inputs-controls/VcsLabel.vue';

  const state = getStoryState();
  const label = ref('VcsLabel');
</script>

<template>
  <Story title="VcsLabel" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsLabel v-bind="{ ...state.bind }">{{ label }}</VcsLabel>
    <template #controls>
      <GlobalControls v-model="state">
        <HstText v-model="label" title="Label">
          <template #actions></template>
        </HstText>
      </GlobalControls>
    </template>
  </Story>
</template>
