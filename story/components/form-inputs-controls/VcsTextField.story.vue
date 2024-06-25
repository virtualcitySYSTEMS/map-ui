<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsTextField from '../../../src/components/form-inputs-controls/VcsTextField.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState(undefined, 'row');
  const textValue = ref('short Text');
  const numberValue = ref(2.555);
  const clearable = ref(true);
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
        type="text"
        v-model="textValue"
        :clearable="clearable"
        :rules="[(v) => v.length > 10 || 'Input length is wrong']"
      />
      <template #controls>
        <GlobalControls v-model="state">
          <HstText title="modelValue" v-model="textValue"></HstText>
          <HstCheckbox title="clearable" v-model="clearable"></HstCheckbox>
        </GlobalControls>
      </template>
    </Variant>
    <Variant title="Number">
      <VcsTextField
        v-bind="{ ...state.bind }"
        type="number"
        v-model="numberValue"
        :clearable="clearable"
        :decimals="2"
        :rules="[(v) => v === 2 || 'input is not 2']"
      />
      <template #controls>
        <GlobalControls v-model="state">
          <HstNumber title="modelValue" v-model="numberValue"></HstNumber>
          <HstCheckbox title="clearable" v-model="clearable"></HstCheckbox>
        </GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
