<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsTextArea from '../../../src/components/form-inputs-controls/VcsTextArea.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState(undefined, 'row');
  const textValue = ref('short Text');
  const clearable = ref(true);
</script>

<template>
  <Story title="VcsTextArea" :meta="{ wrapper: { ...state.wrapper } }">
    <Variant title="Text">
      <VcsTextArea
        v-bind="{ ...state.bind }"
        v-model="textValue"
        :clearable="clearable"
      />
      <template #controls>
        <GlobalControls v-model="state">
          <HstText title="modelValue" v-model="textValue"></HstText>
          <HstCheckbox title="clearable" v-model="clearable"></HstCheckbox>
        </GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
