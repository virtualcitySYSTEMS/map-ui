<template>
  <v-sheet>
    <v-sheet class="px-2 d-grid">
      <v-switch v-model="selectable" label="Selectable" class="ma-0" />
      <v-switch
        :disabled="!selectable"
        v-model="selectSingle"
        label=" Single Select"
        class="ma-0"
      />
      <v-switch v-model="searchable" label="Searchable" class="ma-0" />
      <v-dialog v-model="dialog" width="400">
        <template #activator="{ on }">
          <vcs-form-button v-on="on"> Add An item </vcs-form-button>
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
            <vcs-form-button type="submit" variant="filled">
              Add
            </vcs-form-button>
          </v-form>
        </v-card>
      </v-dialog>
    </v-sheet>

    <vcs-data-table
      :items="items"
      item-key="id"
      :headers="headers"
      :show-select="selectable"
      :single-select="selectSingle"
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
    VcsActionButtonList,
  } from '@vcmap/ui';
  import { VSwitch, VSheet, VDialog, VCard, VForm } from 'vuetify/lib';
  import { ref } from 'vue';

  const defaultHeaders = [
    {
      text: 'Name',
      value: 'name',
    },
    {
      text: 'Type',
      value: 'type',
    },
    {
      text: 'Datum',
      value: 'date',
      sort: (a, b) => new Date(b) - new Date(a),
    },
    { text: 'Actions', value: 'actions', sortable: false },
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
  ];

  export default {
    name: 'DataTableExample',
    components: {
      VcsDataTable,
      VcsFormButton,
      VcsTextField,
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
        id: items.value.length,
        name: 'foo',
        type: 'foo',
        date: new Date(),
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
