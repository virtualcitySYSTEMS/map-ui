<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsDatePicker from '../../../src/components/form-inputs-controls/VcsDatePicker.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState();
  const label = ref('Some Label');
</script>

<template>
  <Story title="VcsDatePicker" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsDatePicker v-bind="{ ...state.bind }" :label="label" />
    <template #controls>
      <GlobalControls v-model="state">
        <HstText v-model="label" title="Label"></HstText>
      </GlobalControls>
    </template>
  </Story>
</template>
