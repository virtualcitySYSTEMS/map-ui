<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsFileInput from '../../../src/components/form-inputs-controls/VcsFileInput.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState(undefined, 'row');
  const clearable = ref(true);
  const fileValue = ref([]);
</script>

<template>
  <Story title="VcsFileInput" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsFileInput
      v-bind="{ ...state.bind }"
      v-model="fileValue"
      :clearable="clearable"
    />
    <template #controls>
      <GlobalControls v-model="state">
        <HstCheckbox title="clearable" v-model="clearable"></HstCheckbox>
      </GlobalControls>
    </template>
  </Story>
</template>
