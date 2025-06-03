<script setup>
  /* eslint-disable no-console */
  import { reactive } from 'vue';
  import { moveDraggableItems } from '../../../src/components/lists/dragHelper.js';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsList from '../../../src/components/lists/VcsList.vue';

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
  };

  const items = reactive([
    {
      name: 'foo',
      title: 'Foo',
      tooltip: 'this is the foo',
      icon: 'mdi-pen',
      selectionChanged: (value) => console.log('changed cb foo', value),
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
    },
    {
      name: 'baz',
      title: 'Baz',
      disabled: true,
      tooltip: 'special baz',
      selectionChanged: (value) => console.log('changed cb baz', value),
    },
    {
      name: 'baz2',
      title: 'Baz 2',
      tooltip: 'special baz',
      selectionChanged: (value) => console.log('changed cb baz', value),
    },
    {
      name: 'baz3',
      title: 'Baz 3',
      hasUpdate: true,
      tooltip: 'special baz',
      selectionChanged: (value) => console.log('changed cb baz', value),
    },
    {
      name: `with very, very, very, very, very long name`,
      title: `with very, very, very, very, very, very, very, very, very long name`,
      selectionChanged: (value) => console.log('changed cb', value),
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
    },
    {
      name: 'short title',
      title: 'short title',
      actions: [
        {
          name: 'titleChange',
          icon: 'mdi-sync',
          callback() {
            if (items.at(-1).title === 'short title') {
              items.at(-1).title =
                'very, very, very, very, very, very, long title for just this small item';
            } else {
              items.at(-1).title = 'short title';
            }
          },
        },
      ],
    },
    renamableItem,
  ]);

  const state = getStoryState('$vcs3d');
</script>

<template>
  <Story title="Lists/VcsList" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsList
      :items="items"
      v-bind="{ ...state.bind }"
      title="foo - bar"
      @item-moved="moveDraggableItems(items, $event)"
    />
    <template #controls>
      <GlobalControls v-model="state" with-icon></GlobalControls>
    </template>
  </Story>
</template>
