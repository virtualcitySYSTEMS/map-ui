<script setup>
  import { VIcon } from 'vuetify/components';
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsRadio from '../../../src/components/form-inputs-controls/VcsRadio.vue';

  const state = getStoryState();
  const selected = ref(undefined);
</script>

<template>
  <Story
    title="VcsRadio"
    :meta="{ wrapper: { ...state.wrapper } }"
    :layout="{ type: 'grid', width: '100%' }"
  >
    <Variant title="normal">
      <VcsRadio
        :items="[
          { label: 'Option 1 (string)', value: '1' },
          { label: 'Option 2 (integer)', value: 2, color: 'green' },
          'three',
        ]"
        :rules="[(v) => Number.isFinite(v) || 'Selection is not a number!']"
        v-bind="{ ...state.bind }"
        v-model="selected"
      />
      <template #controls>
        <GlobalControls v-model="state"></GlobalControls>
      </template>
    </Variant>
    <Variant title="Slot #top-label with class 'justify-center'">
      <VcsRadio
        :items="[
          { value: 'AAAAAAAA', src: 'mdi-circle-outline' },
          { value: 'B', src: 'mdi-close' },
          { value: 'C', src: 'mdi-triangle-outline' },
          { value: 'D', src: 'mdi-square-outline' },
        ]"
        :rules="[(v) => v !== 'D' || 'Square is not allowed']"
        tooltip="This is a radio grid"
        inline
        label-position="top"
        class="d-flex justify-center"
        v-model="selected"
        v-bind="{ ...state.bind }"
      >
        <template #label="{ item, error }">
          <figure>
            <v-icon
              size="24"
              class="d-flex justify-center mx-auto"
              :class="{ 'text-error': error }"
            >
              {{ item.src }}
            </v-icon>
            <figcaption
              class="d-flex justify-center"
              :class="{ 'text-error': error }"
            >
              {{ item.value }}
            </figcaption>
          </figure>
        </template>
      </VcsRadio>
      <template #controls>
        <GlobalControls v-model="state"></GlobalControls>
      </template>
    </Variant>
  </Story>
</template>

<docs lang="md">
# VcsRadio

## Vuetify API reference

- [v-radio](https://vuetifyjs.com/en/api/v-radio/)
</docs>
