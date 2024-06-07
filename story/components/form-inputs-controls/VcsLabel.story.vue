<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../GlobalControls.vue';
  import VcsLabel from '../../../src/components/form-inputs-controls/VcsLabel.vue';

  const state = getStoryState();
  const label = ref('VcsLabel');
</script>

<template>
  <Story title="VcsLabel">
    <VcsLabel>{{ label }}</VcsLabel>
    <template #controls>
      <GlobalControls v-model="state"></GlobalControls>
      <HstText v-model="label" title="Label">
        <template #actions></template>
      </HstText>
    </template>
  </Story>
</template>
