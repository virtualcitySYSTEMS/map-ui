<script setup>
  /* eslint-disable no-console */
  import { reactive } from 'vue';
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
      name: 'baz',
      title: 'Baz',
      tooltip: 'special baz',
      selectionChanged: (value) => console.log('changed cb baz', value),
    },
    {
      name: 'baz',
      title: 'Baz',
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
      name: 'bar',
      title: 'Bar',
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

  function move({ item, targetIndex }) {
    let target = targetIndex;
    target = target >= 0 ? target : 0;
    target = target < items.length ? target : items.length - 1;
    const itemIndex = items.findIndex((i) => i.name === item.name);
    if (itemIndex !== target) {
      items.splice(itemIndex, 1);
      items.splice(target, 0, item);
    }
    return target;
  }

  const state = getStoryState('$vcs3d');
</script>

<template>
  <Story title="VcsList" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsList
      :items="items"
      v-bind="{ ...state.bind }"
      title="foo - bar"
      @item-moved="move"
    />
    <template #controls>
      <GlobalControls v-model="state" with-icon></GlobalControls>
    </template>
  </Story>
</template>
