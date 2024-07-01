<script setup>
  import { getStoryState } from '../../setup.js';
  import VcsActionButtonList from '../../../src/components/buttons/VcsActionButtonList.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const actions = [
    {
      name: 'action1',
      title: 'title1',
      icon: 'mdi-circle',
      active: true,
      disabled: false,
    },
    {
      name: 'action2',
      title: 'title2',
      icon: 'mdi-account',
      active: false,
      disabled: false,
    },
    {
      name: 'action3',
      title: 'title3',
      icon: 'mdi-arrow-left',
      active: false,
      disabled: false,
    },
    {
      name: 'action4',
      title: 'title4',
      icon: 'mdi-account-group',
      active: true,
      disabled: false,
    },
  ];
  const state = getStoryState('$vcs3d', 'row');
</script>

<template>
  <Story
    title="Buttons/VcsActionButtonList"
    :meta="{ wrapper: { ...state.wrapper } }"
  >
    <Variant title="VcsButton">
      <VcsActionButtonList
        button="VcsButton"
        :actions="actions"
        v-bind="{ ...state.bind }"
      >
      </VcsActionButtonList>
      <template #controls>
        <GlobalControls v-model="state"></GlobalControls>
      </template>
    </Variant>
    <Variant title="VcsToolButton">
      <VcsActionButtonList
        button="VcsToolButton"
        :actions="actions"
        v-bind="{ ...state.bind }"
      >
      </VcsActionButtonList>
      <template #controls>
        <GlobalControls v-model="state"></GlobalControls>
      </template>
    </Variant>
    <Variant title="VcsFormButton">
      <VcsActionButtonList
        button="VcsFormButton"
        :actions="actions"
        v-bind="{ ...state.bind }"
      >
      </VcsActionButtonList>
      <template #controls>
        <GlobalControls v-model="state"></GlobalControls>
      </template>
    </Variant>
  </Story>
</template>
