<script setup>
  /* eslint-disable no-console */
  import { ref, reactive } from 'vue';
  import { moveDraggableItems } from '../../../src/components/lists/dragHelper.js';
  import { getStoryState } from '../../setup.js';
  import GlobalControls from '../../controls/GlobalControls.vue';
  import VcsTreeview from '../../../src/components/lists/VcsTreeview.vue';

  function createActions(overflow) {
    const actions = [
      {
        name: 'simple',
        icon: '$vcs2d',
        title: 'Im a simple action',
        callback() {
          console.log('callback ', this.name);
        },
      },
      {
        name: '3d',
        icon: '$vcs3d',
        active: false,
        callback() {
          this.active = !this.active;
          console.log('callback ', this.name);
        },
      },
    ];

    if (overflow) {
      actions.push({
        name: 'im an overflow',
        callback() {
          console.log('callback ', this.name);
        },
      });
    }

    return actions;
  }

  function createItems(prefix) {
    return [
      {
        name: prefix,
      },
      {
        name: `${prefix} with very, very, very, very, very long name`,
        title: `${prefix} with very, very, very, very, very long name`,
      },
      {
        name: `${prefix} with actions`,
        actions: createActions(),
      },
      {
        name: `${prefix} with overflow actions`,
        actions: createActions(true),
      },
      {
        name: `${prefix} with icon`,
        icon: '$vcsPen',
        actions: createActions(true),
      },
      {
        name: `${prefix} with tooltip`,
        tooltip: 'im a tooltip',
        actions: createActions(true),
      },
    ];
  }

  const items = reactive([
    ...createItems('root'),
    {
      name: 'node',
      children: [
        ...createItems('child'),
        {
          name: 'child node',
          children: createItems('child child'),
        },
      ],
    },
    {
      name: 'other node',
      children: createItems('other'),
    },
    {
      name: 'empty node',
      children: [],
    },
    {
      name: 'no drop item',
      tooltip: 'this item does neither allow drop before, nor after, nor into',
    },
    {
      name: 'no drop group',
      tooltip:
        'this node does not allow drag&drop into or out, but can be moved as a whole and its childs can be moved',
      children: createItems('no drop group'),
    },
  ]);

  const state = getStoryState('$vcs3d');
  const openAll = ref(false);
  const openOnClick = ref(true);

  function dropTargetZones(item, targetItem) {
    if (
      item.name.includes('no drop group') &&
      targetItem.name.includes('no drop group')
    ) {
      return { into: false };
    } else if (
      item.name.includes('no drop') ||
      targetItem.name.includes('no drop')
    ) {
      return false;
    } else if (targetItem.name.includes('node')) {
      return true;
    }
    return { into: false };
  }
</script>

<template>
  <Story title="Lists/VcsTreeview" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsTreeview
      v-bind="{ ...state.bind }"
      :items="items"
      :open-all="openAll"
      :open-on-click="openOnClick"
      :drop-target-zones="dropTargetZones"
      @item-moved="moveDraggableItems(items, $event)"
    />
    <template #controls>
      <GlobalControls with-icon v-model="state">
        <HstCheckbox title="Open all on startup" v-model="openAll" />
        <HstCheckbox title="Open on click" v-model="openOnClick" />
      </GlobalControls>
    </template>
  </Story>
</template>
