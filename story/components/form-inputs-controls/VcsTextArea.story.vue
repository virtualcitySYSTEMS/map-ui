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
  <Story
    title="VcsTextArea"
    :meta="{ wrapper: { ...state.wrapper } }"
    :layout="{ type: 'grid', width: '100%' }"
  >
    <Variant title="Text">
      <VcsTextArea
        prepend-icon="mdi-map-marker"
        label="Label"
        :clearable="clearable"
        v-bind="{ ...state.bind }"
        v-model="textValue"
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
