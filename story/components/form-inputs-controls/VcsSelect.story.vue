<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsSelect from '../../../src/components/form-inputs-controls/VcsSelect.vue';

  const state = getStoryState();
  const items = ref(['one', 'two', 'three']);
  const placeholder = ref('VcsSelect');
</script>

<template>
  <Story title="VcsSelect" :meta="{ wrapper: { type: 'row' } }">
    <VcsSelect :items="items" :placeholder="placeholder" />
    <template #controls>
      <GlobalControls v-model="state"></GlobalControls>
      <HstText type="array" v-model="placeholder" title="placeholder">
        <template #actions></template>
      </HstText>
      <HstJson v-model="items" title="items">
        <template #actions></template>
      </HstJson>
    </template>
  </Story>
</template>
