<script setup>
  /* eslint-disable no-console */
  import { ref } from 'vue';
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
        name: 'with icon',
        icon: '$vcsPen',
        actions: createActions(true),
      },
      {
        name: 'with tooltip',
        tooltip: 'im a tooltip',
        actions: createActions(true),
      },
    ];
  }

  const items = [
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
      name: 'otherNode',
      children: createItems('other'),
    },
  ];

  const state = getStoryState('$vcs3d');
  const openAll = ref(false);
  const openOnClick = ref(true);
</script>

<template>
  <Story title="Lists/VcsTreeview" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsTreeview
      v-bind="{ ...state.bind }"
      :items="items"
      :open-all="openAll"
      :open-on-click="openOnClick"
    />
    <template #controls>
      <GlobalControls with-icon v-model="state">
        <HstCheckbox title="Open all on startup" v-model="openAll" />
        <HstCheckbox title="Open on click" v-model="openOnClick" />
      </GlobalControls>
    </template>
  </Story>
</template>
