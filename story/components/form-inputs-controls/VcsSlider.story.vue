<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsSlider from '../../../src/components/form-inputs-controls/VcsSlider.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState(undefined, 'row');
  const numberValue = ref(15);
</script>

<template>
  <Story title="VcsSlider" :meta="{ wrapper: { ...state.wrapper } }">
    <Variant title="default">
      <VcsSlider
        v-bind="{ ...state.bind }"
        type="number"
        v-model="numberValue"
      />
      <template #controls>
        <GlobalControls v-model="state">
          <HstNumber title="value" v-model="numberValue"></HstNumber>
        </GlobalControls>
      </template>
    </Variant>
    <Variant title="ticks">
      <VcsSlider
        :step="1"
        :min="10"
        :max="20"
        show-ticks="always"
        v-bind="{ ...state.bind }"
        type="number"
        v-model="numberValue"
      />
      <template #controls>
        <GlobalControls v-model="state">
          <HstNumber title="value" v-model="numberValue"></HstNumber>
        </GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
