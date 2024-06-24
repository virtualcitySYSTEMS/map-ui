<script setup>
  import { ref } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsTreeviewSearchbar from '../../../src/components/lists/VcsTreeviewSearchbar.vue';

  const state = getStoryState();
  const search = ref('');
</script>

<template>
  <Story title="VcsTreeviewSearchbar" :meta="{ wrapper: { type: 'window' } }">
    <VcsTreeviewSearchbar v-model="search" v-bind="{ ...state.bind }" />
    <template #controls>
      <GlobalControls v-model="state" with-icon>
        <HstText v-model="search" title="Model"> </HstText>
      </GlobalControls>
    </template>
  </Story>
</template>
