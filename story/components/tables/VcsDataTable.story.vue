<script setup>
  import { ref, shallowRef } from 'vue';
  import { getStoryState } from '../../setup.js';
  import VcsDataTable from '../../../src/components/tables/VcsDataTable.vue';
  import GlobalControls from '../../controls/GlobalControls.vue';

  const state = getStoryState();
  const showSelect = ref(false);
  const selected = ref([]);
  const loading = ref(false);

  const headers = [
    {
      title: 'id',
      key: 'id',
    },
    {
      title: 'Name',
      key: 'name',
    },
    {
      title: 'Date',
      key: 'date',
      sort: (a, b) => new Date(b) - new Date(a),
    },
  ];

  function createItems(nr) {
    const items = [];
    for (let i = 0; i < nr; i++) {
      items.push({
        id: i,
        name: `item-${i}`,
        date: new Date(Math.floor(Math.random() * 1000000000) + 1).toString(),
      });
    }
    return items;
  }

  const items = shallowRef(createItems(20));

  async function updateItems() {
    items.value = [];
    loading.value = true;
    setTimeout(() => {
      items.value = createItems(20);
      loading.value = false;
    }, 2000);
  }
</script>

<template>
  <Story title="VcsDataTable" :meta="{ wrapper: { ...state.wrapper } }">
    <VcsDataTable
      :items="items"
      :headers="headers"
      :show-select="showSelect"
      :loading="loading"
      v-model="selected"
      v-bind="{ ...state.bind }"
    />
    <template #controls>
      <GlobalControls v-model="state">
        <HstCheckbox title="Selectable" v-model="showSelect" />
        <HstCheckbox title="Loading" v-model="loading" />
        <HstButton class="ma-2" @click="updateItems"
          >Fetch new dummy items</HstButton
        >
      </GlobalControls>
    </template>
  </Story>
</template>

<docs lang="md">
# VcsDataTable

## Vuetify API Reference

- [v-data-table](https://vuetifyjs.com/en/api/v-data-table/)
</docs>
