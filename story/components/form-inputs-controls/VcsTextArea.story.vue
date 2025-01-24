<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsTextArea from '../../../src/components/form-inputs-controls/VcsTextArea.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState(undefined, 'row');
  const textValue = ref('short Text');
  const clearable = ref(true);
  const applyRules = ref(true);
</script>

<template>
  <Story title="VcsTextArea" :meta="{ wrapper: { ...state.wrapper } }">
    <Variant title="Text">
      <VcsTextArea
        v-bind="{ ...state.bind }"
        v-model="textValue"
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
  </Story>
</template>
