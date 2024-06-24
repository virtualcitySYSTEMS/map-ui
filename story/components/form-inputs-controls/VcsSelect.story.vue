<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsSelect from '../../../src/components/form-inputs-controls/VcsSelect.vue';

  const state = getStoryState(undefined, 'row');
  const multiple = ref(true);
  const items = ref([
    'one',
    'two',
    'really long entry, so it is really really long',
    'second even longer really long entry, so it is really really really long',
  ]);
  const itemValue = ref([]);
</script>

<template>
  <Story title="VcsSelect" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsSelect
      v-bind="{ ...state.bind }"
      :multiple="multiple"
      :items="items"
      v-model="itemValue"
      :rules="[
        (v) => {
          if (Array.isArray(v)) {
            return !v.includes('two') || 'two is not allowed';
          } else {
            return v !== 'two' || 'two is not allowed';
          }
        },
      ]"
    />
    <template #controls>
      <GlobalControls v-model="state">
        <HstJson v-model="items" title="items" />
        <HstCheckbox type="checkbox" v-model="multiple" title="multiple" />
      </GlobalControls>
    </template>
  </Story>
</template>
