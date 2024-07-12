<script setup>
  /* eslint-disable no-console */
  import { reactive, watch } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsListItem from '../../../src/components/lists/VcsListItem.vue';

  const item = reactive({
    name: 'foo',
    disabled: false,
    renameable: true,
    title: 'foo',
    tooltip: 'this is the foo',
    hasUpdate: false,
    actions: [],
  });

  const actionItem = reactive({
    name: 'foo',
    disabled: false,
    renameable: true,
    title: 'foo',
    tooltip: 'this is the foo',
    hasUpdate: false,
    actions: [
      {
        name: 'icon',
        icon: 'mdi-pencil',
        callback() {
          console.log('icon');
        },
      },
      {
        name: 'console',
        callback() {
          console.log('console.log');
        },
      },
    ],
  });

  const state = getStoryState('$vcs3d');

  watch(
    () => state.icon,
    () => {
      item.icon = state.icon;
      actionItem.icon = state.icon;
    },
    { immediate: true },
  );
</script>

<template>
  <Story title="VcsListItem" :meta="{ wrapper: { ...state.wrapper } }">
    <Variant title="Default">
      <VcsListItem :item="item" v-bind="{ ...state.attrs }" />
      <template #controls>
        <GlobalControls v-model="state" with-icon />
        <HstText title="Title" v-model="item.title" />
        <HstText title="Tooltip" v-model="item.tooltip" />
        <HstCheckbox title="Disabled" v-model="item.disabled" />
        <HstCheckbox title="HasUpdate" v-model="item.hasUpdate" />
      </template>
    </Variant>
    <Variant title="Actions">
      <VcsListItem :item="actionItem" v-bind="{ ...state.attrs }" />
      <template #controls>
        <GlobalControls v-model="state" with-icon />
        <HstText title="Title" v-model="actionItem.title" />
        <HstText title="Tooltip" v-model="actionItem.tooltip" />
        <HstCheckbox title="Disabled" v-model="actionItem.disabled" />
        <HstCheckbox title="HasUpdate" v-model="actionItem.hasUpdate" />
      </template>
    </Variant>
  </Story>
</template>
