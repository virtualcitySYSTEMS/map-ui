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

  const totalItems = ref(-1);
  const totalPages = ref(-1);
  const items = shallowRef(createItems(20));
  const serverItems = shallowRef(createItems(20));

  async function requestServerItems({ page, itemsPerPage, sortBy, search }) {
    loading.value = true;
    setTimeout(() => {
      const newItems = createItems(20).filter(({ name }) =>
        name.includes(search),
      );
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;

      if (sortBy?.length) {
        const sortKey = sortBy[0].key;
        const sortOrder = sortBy[0].order;
        newItems.sort((a, b) => {
          const aValue = a[sortKey];
          const bValue = b[sortKey];
          return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        });
      }

      serverItems.value = newItems.slice(start, end);
      totalItems.value = newItems.length;
      totalPages.value = Math.ceil(totalItems.value / itemsPerPage);
      loading.value = false;
    }, 500);
  }
</script>

<template>
  <Story title="VcsDataTable" :meta="{ wrapper: { ...state.wrapper } }">
    <Variant title="VDataTable">
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
        </GlobalControls>
      </template>
    </Variant>
    <Variant title="VDataTableServer">
      <VcsDataTable
        base-component="VDataTableServer"
        :items="serverItems"
        :headers="headers"
        :show-select="showSelect"
        :server-items-length="totalItems"
        :server-pages-length="totalPages"
        :loading="loading"
        v-model="selected"
        @update:items="requestServerItems"
        v-bind="{ ...state.bind }"
      />
      <template #controls>
        <GlobalControls v-model="state">
          <HstCheckbox title="Selectable" v-model="showSelect" />
          <HstCheckbox title="Loading" v-model="loading" />
        </GlobalControls>
      </template>
    </Variant>
  </Story>
</template>

<docs lang="md">
# VcsDataTable

## Vuetify API Reference

- [v-data-table](https://vuetifyjs.com/en/api/v-data-table/)
</docs>
