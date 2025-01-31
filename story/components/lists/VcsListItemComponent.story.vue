<script setup>
  /* eslint-disable no-console */
  import { reactive, watch } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsListItemComponent from '../../../src/components/lists/VcsListItemComponent.vue';

  const item = reactive({
    name: 'foo',
    disabled: false,
    renameable: true,
    titleChanged: (value) => {
      item.title = value;
    },
    title: 'foo',
    tooltip: 'this is the foo',
    hasUpdate: false,
    actions: [],
  });

  const actionItem = reactive({
    name: 'foo',
    disabled: false,
    renameable: true,
    titleChanged: (value) => {
      actionItem.title = value;
    },
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
  <Story title="Lists/VcsListItem" :meta="{ wrapper: { ...state.wrapper } }">
    <Variant title="Default">
      <VcsListItemComponent :item="item" v-bind="{ ...state.attrs }" />
      <template #controls>
        <GlobalControls v-model="state" with-icon />
        <HstText title="title" v-model="item.title" />
        <HstText title="tooltip" v-model="item.tooltip" />
        <HstCheckbox title="renamable" v-model="item.renamable" />
        <HstCheckbox title="disabled" v-model="item.disabled" />
        <HstCheckbox title="hasUpdate" v-model="item.hasUpdate" />
      </template>
    </Variant>
    <Variant title="Actions">
      <VcsListItemComponent :item="actionItem" v-bind="{ ...state.attrs }" />
      <template #controls>
        <GlobalControls v-model="state" with-icon />
        <HstText title="title" v-model="actionItem.title" />
        <HstText title="tooltip" v-model="actionItem.tooltip" />
        <HstCheckbox title="renamable" v-model="actionItem.renamable" />
        <HstCheckbox title="disabled" v-model="actionItem.disabled" />
        <HstCheckbox title="hHasUpdate" v-model="actionItem.hasUpdate" />
      </template>
    </Variant>
  </Story>
</template>
