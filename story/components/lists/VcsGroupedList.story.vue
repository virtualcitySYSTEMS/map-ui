<script setup>
  /* eslint-disable no-console */
  import { reactive } from 'vue';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsGroupedList from '../../../src/components/lists/VcsGroupedList.vue';

  const renamableItem = {
    name: 'renamable item',
    title: 'renamable item',
    renamable: true,
    titleChanged: (value) => {
      renamableItem.title = value;
    },
    actions: [
      {
        name: 'toggle rename',
        callback() {
          renamableItem.renamable = !renamableItem.renamable;
        },
      },
    ],
    group: 'group-renamable',
  };

  const items = reactive([
    {
      name: 'foo',
      title: 'Foo',
      tooltip: 'this is the foo',
      icon: 'mdi-pen',
      selectionChanged: (value) => console.log('changed cb foo', value),
      group: 'group-1',
    },
    {
      name: 'bar',
      title: 'Bar',
      actions: [
        {
          name: 'console.log',
          callback() {
            console.log('bar action');
          },
        },
      ],
      selectionChanged: (value) => console.log('changed cb bar', value),
      group: 'group-2',
    },
    {
      name: 'baz',
      title: 'Baz',
      disabled: true,
      tooltip: 'special baz',
      selectionChanged: (value) => console.log('changed cb baz', value),
      group: 'group-2',
    },
    {
      name: 'baz2',
      title: 'Baz 2',
      tooltip: 'special baz',
      selectionChanged: (value) => console.log('changed cb baz', value),
      group: 'group-1',
    },
    {
      name: 'baz3',
      title: 'Baz 3',
      hasUpdate: true,
      tooltip: 'special baz',
      selectionChanged: (value) => console.log('changed cb baz', value),
      group: 'group-1',
    },
    {
      name: `with very, very, very, very, very long name`,
      title: `with very, very, very, very, very, very, very, very, very long name`,
      selectionChanged: (value) => console.log('changed cb', value),
      group: 'group-2',
    },
    {
      name: 'bar2',
      title: 'Bar 2',
      hasUpdate: true,
      actions: [
        {
          name: 'console.log',
          callback() {
            console.log('bar action');
          },
        },
        {
          name: 'console.log2',
          icon: 'mdi-pencil',
          callback() {
            console.log('bar action');
          },
        },
      ],
      selectionChanged: (value) => console.log('changed cb bar', value),
      group: 'group-1',
    },
    {
      name: 'short title',
      title: 'short title',
      actions: [
        {
          name: 'titleChange',
          icon: 'mdi-sync',
          callback() {
            if (items.value.at(-1).title === 'short title') {
              items.value.at(-1).title =
                'very, very, very, very, very, very, long title for just this small item';
            } else {
              items.value.at(-1).title = 'short title';
            }
          },
        },
      ],
      group: 'group-1',
    },
    renamableItem,
  ]);

  const groups = reactive([
    { name: 'group-1' },
    {
      name: 'group-2',
      headerActions: [
        {
          name: 'console.log',
          callback() {
            console.log('group-2');
          },
        },
      ],
    },
  ]);

  const state = getStoryState('$vcs3d');
</script>

<template>
  <Story title="Lists/VcsGroupedList" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsGroupedList
      v-bind="{ ...state.bind }"
      :items="items"
      :groups="groups"
    />
    <template #controls>
      <GlobalControls v-model="state" with-icon></GlobalControls>
    </template>
  </Story>
</template>
