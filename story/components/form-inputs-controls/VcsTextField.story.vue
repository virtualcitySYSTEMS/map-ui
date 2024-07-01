<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsTextField from '../../../src/components/form-inputs-controls/VcsTextField.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState(undefined, 'row');
  const textValue = ref('short Text');
  const numberValue = ref(2.555);
  const clearable = ref(true);
  const applyRules = ref(true);
</script>

<template>
  <Story
    title="VcsTextField"
    :meta="{ wrapper: { ...state.wrapper } }"
    :layout="{ type: 'grid', width: '100%' }"
  >
    <Variant title="Text">
      <VcsTextField
        v-bind="{ ...state.bind }"
        v-model="textValue"
        @update:model-value="(v) => console.log(v)"
        type="text"
        :clearable="clearable"
        :rules="
          applyRules
            ? [(v) => v.length > 10 || 'Input length is wrong']
            : undefined
        "
      />
      <template #controls>
        <GlobalControls v-model="state">
          <HstText title="modelValue" v-model="textValue"></HstText>
          <HstCheckbox title="clearable" v-model="clearable"></HstCheckbox>
          <HstCheckbox title="apply rules" v-model="applyRules"></HstCheckbox>
        </GlobalControls>
      </template>
    </Variant>
    <Variant title="Number">
      <VcsTextField
        v-bind="{ ...state.bind }"
        type="number"
        v-model="numberValue"
        :clearable="clearable"
        :rules="applyRules ? [(v) => v === 2 || 'input is not 2'] : undefined"
        :decimals="2"
      />
      <template #controls>
        <GlobalControls v-model="state">
          <HstNumber title="modelValue" v-model="numberValue"></HstNumber>
          <HstCheckbox title="clearable" v-model="clearable"></HstCheckbox>
          <HstCheckbox title="apply rules" v-model="applyRules"></HstCheckbox>
        </GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
