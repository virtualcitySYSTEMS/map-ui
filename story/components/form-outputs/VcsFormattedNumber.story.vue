<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsFormattedNumber from '../../../src/components/form-output/VcsFormattedNumber.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState(undefined, 'row');
  const numberValue = ref(5);
  const prefix = ref('in');
  const fractionDigits = ref(3);
  const unit = ref('deg');
</script>

<template>
  <Story title="VcsFormattedNumber" :meta="{ wrapper: { ...state.wrapper } }">
    <Variant title="Text">
      <VcsFormattedNumber
        v-bind="{ ...state.bind }"
        :prefix="prefix"
        :fraction-digits="fractionDigits"
        :unit="unit"
        v-model.number="numberValue"
      >
      </VcsFormattedNumber>
      <template #controls>
        <GlobalControls v-model="state">
          <HstText title="modelValue" v-model.number="numberValue"></HstText>
        </GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
