<script setup>
  import { shallowRef } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsChipArrayInput from '../../../src/components/form-inputs-controls/VcsChipArrayInput.vue';

  const state = getStoryState();
  const stringItems = shallowRef(['a', 'b', 'c']);
  const numberItems = shallowRef([1, 2, 3]);
</script>

<template>
  <Story
    title="VcsChipArrayInput"
    :meta="{ wrapper: { ...state.wrapper } }"
    :layout="{ type: 'grid', width: '100%' }"
  >
    <Variant title="Text">
      <VcsChipArrayInput v-model="stringItems" v-bind="{ ...state.bind }" />
      <template #controls>
        <GlobalControls v-model="state">
          <HstJson title="Model" v-model="stringItems" />
        </GlobalControls>
      </template>
    </Variant>
    <Variant title="Number">
      <VcsChipArrayInput
        v-model="numberItems"
        type="number"
        :rules="[(v) => (v > 10 ? 'Input must be lower 10' : true)]"
        v-bind="{ ...state.bind }"
      />
      <template #controls>
        <GlobalControls v-model="state">
          <HstJson title="Model" v-model="numberItems" />
        </GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
