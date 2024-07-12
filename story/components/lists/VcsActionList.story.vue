<script setup>
  /* eslint-disable no-console */
  import { reactive } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsActionList from '../../../src/components/lists/VcsActionList.vue';

  function createActions() {
    return [
      reactive({
        name: 'simple',
        icon: '$vcs2d',
        title: 'Im a simple action (TOOLTIP)',
        callback() {
          console.log('callback ', this.name);
        },
      }),
      reactive({
        name: '3d',
        icon: '$vcs3d',
        active: false,
        callback() {
          this.active = !this.active;
          console.log('callback ', this.name);
        },
      }),
      reactive({
        name: 'example action',
        callback() {
          console.log('callback ', this.name);
        },
      }),
    ];
  }
  const actions = createActions();
  const state = getStoryState('$vcs3d');
</script>

<template>
  <Story title="VcsActionList" :meta="{ wrapper: { type: 'window' } }">
    <VcsActionList :actions="actions" />
    <template #controls>
      <GlobalControls v-model="state" with-icon></GlobalControls>
    </template>
  </Story>
</template>
