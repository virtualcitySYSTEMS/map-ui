<script setup>
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsRadio from '../../../src/components/form-inputs-controls/VcsRadio.vue';

  const state = getStoryState();
</script>

<template>
  <Story title="VcsRadio" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsRadio
      :items="[
        { label: 'Option 1 (string)', value: '1' },
        { label: 'Option 2 (integer)', value: 2, color: 'green' },
        'three',
      ]"
      :rules="[(v) => Number.isFinite(v) || 'Selection is not a number!']"
    />
    <template #controls>
      <GlobalControls v-model="state"></GlobalControls>
    </template>
  </Story>
</template>
