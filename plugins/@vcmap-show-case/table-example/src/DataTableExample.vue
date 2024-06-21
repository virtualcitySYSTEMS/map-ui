<template>
  <v-sheet>
    <v-sheet class="px-2 d-grid">
      <v-switch
        v-model="selectable"
        label="Selectable"
        density="compact"
        class="mx-1"
      />
      <v-switch
        :disabled="!selectable"
        v-model="selectSingle"
        label=" Single Select"
        density="compact"
        class="mx-1"
      />
      <v-switch
        v-model="searchable"
        label="Searchable"
        density="compact"
        class="mx-1"
      />
      <v-dialog v-model="dialog" width="400">
        <template #activator="{ props }">
          <vcs-form-button v-bind="props"> Add An item </vcs-form-button>
        </template>
        <v-card class="pa-2">
          <v-form @submit.prevent="add">
            <vcs-text-field
              v-model="newItem.name"
              label="Name"
              :rules="required"
            />
            <vcs-text-field
              v-model="newItem.type"
              label="type"
              :rules="required"
            />
            <vcs-text-field v-model="newItem.date" type="date" label="date" />
            <vcs-checkbox label="disabled" v-model="newItem.disabled" />
            <vcs-form-button type="submit" variant="filled">
              Add
            </vcs-form-button>
          </v-form>
        </v-card>
      </v-dialog>
    </v-sheet>

    <vcs-data-table
      :items="items"
      :headers="headers"
      :show-select="selectable"
      :select-strategy="selectSingle ? 'single' : 'page'"
      :items-per-page="2"
      :show-searchbar="searchable"
      v-model="selected"
    >
      <!-- eslint-disable-next-line -->
      <template v-slot:item.actions="{ item }">
        <VcsActionButtonList
          v-if="item.actions"
          :actions="item.actions"
          :block-overflow="true"
          :overflow-count="2"
        />
      </template>
    </vcs-data-table>
  </v-sheet>
</template>

<script>
  import {
    VcsDataTable,
    VcsFormButton,
    VcsTextField,
    VcsCheckbox,
    VcsActionButtonList,
  } from '@vcmap/ui';
  import { VSwitch, VSheet, VDialog, VCard, VForm } from 'vuetify/components';
  import { ref } from 'vue';

  const defaultHeaders = [
    {
      title: 'Name',
      key: 'name',
    },
    {
      title: 'Type',
      key: 'type',
    },
    {
      title: 'Datum',
      key: 'date',
      sort: (a, b) => new Date(b) - new Date(a),
    },
    { title: 'Actions', key: 'actions', sortable: false },
  ];

  const defaultItems = [
    {
      id: 0,
      name: 'foo',
      type: 'Foo',
      date: '8/3/2023 9:24',
      actions: [
        {
          name: 'console.log',
          icon: 'mdi-printer',
          callback() {
            console.log('foo action');
          },
        },
      ],
    },
    {
      id: 1,
      name: 'bar',
      type: 'Bar',
      date: '1/8/2022 19:54',
    },
    {
      id: 2,
      name: 'baz',
      type: 'Baz',
      date: '11/2/2012 14:03',
    },
    {
      id: 3,
      name: 'foo-bar',
      type: 'Foo Bar',
      date: '18/4/1992 21:53',
    },
  ];

  export default {
    name: 'DataTableExample',
    components: {
      VcsDataTable,
      VcsFormButton,
      VcsTextField,
      VcsCheckbox,
      VcsActionButtonList,
      VSwitch,
      VSheet,
      VDialog,
      VCard,
      VForm,
    },
    setup() {
      const selectable = ref(true);
      const searchable = ref(true);
      const selectSingle = ref(false);
      const selected = ref([]);
      const items = ref(defaultItems);
      const headers = ref(defaultHeaders);
      const newItem = ref({
        name: 'foo',
        type: 'foo',
        date: new Date(),
        disabled: false,
      });
      const dialog = ref(false);

      return {
        selectable,
        searchable,
        selectSingle,
        selected,
        items,
        headers,
        newItem,
        dialog,
        required: [
          (v) => !!v || 'Input may not be null',
          (v) => v.length > 0 || 'Input must have a length',
        ],
        add() {
          const item = {
            name: newItem.value.name,
            type: newItem.value.type,
            date: newItem.value.date,
            disabled: newItem.value.disabled,
            id: items.value.length,
          };

          items.value.push(item);
          newItem.value = {
            name: 'foo',
            type: 'foo',
            date: new Date(),
          };
          dialog.value = false;
        },
      };
    },
  };
</script>

<style lang="scss" scoped>
  .d-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
</style>
