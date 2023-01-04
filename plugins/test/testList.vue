<template>
  <v-sheet>
    <v-sheet class="pa-2">
      <v-switch
        v-model="selectable"
        label="Selectable"
      />
      <v-switch
        :disabled="!selectable"
        v-model="selectSingle"
        label=" Single Select"
      />
      <v-switch
        v-model="searchable"
        label="Searchable"
      />
      <v-dialog
        v-model="dialog"
        width="400"
      >
        <template #activator="{ on }">
          <vcs-button v-on="on">
            Add An item
          </vcs-button>
        </template>
        <v-card class="pa-2">
          <v-form
            @submit.prevent="add"
          >
            <vcs-text-field
              v-model="newItem.name"
              label="Name"
              :rules="required"
            />
            <vcs-text-field
              v-model="newItem.title"
              label="Title"
              :rules="required"
            />
            <v-switch label="visible" v-model="newItem.visible" />
            <v-switch label="disabled" v-model="newItem.disabled" />
            <v-switch label="random icon" v-model="newItem.icon" />
            <v-switch label="console.log action" v-model="newItem.action" />
            <v-switch label="console.log on clicked" v-model="newItem.clicked" />
            <v-switch label="console.log selected state" v-model="newItem.selected" />
            <vcs-button
              type="submit"
            >
              Add
            </vcs-button>
          </v-form>
        </v-card>
      </v-dialog>
      <v-divider class="ma-2" />
      <v-switch
        v-model="showTitle"
        label="Show Title"
      />
      <vcs-text-field v-model="title" placeholder="Title" />
      <v-switch
        v-model="titleActions"
        label="Title Actions"
      />
      <v-switch
        v-model="titleIcon"
        label="Title Icon"
      />
      <v-divider class="ma-2" />
      <template v-if="selectable">
        <vcs-button
          @click="selected = []"
        >
          Clear Selection
        </vcs-button>
        <v-switch v-model="showSelection" label="Show Selection" />
        <ul v-if="showSelection">
          <li
            v-for="(i, index) in selected"
            :key="`item-${index}`"
          >
            {{ i.title }}
          </li>
        </ul>
      </template>
      <v-divider class="ma-2" />
    </v-sheet>

    <vcs-list
      :items="items"
      :selectable="selectable"
      :single-select="selectSingle"
      :searchable="searchable"
      :show-title="showTitle"
      :icon="titleIconSrc"
      :actions="titleActionsArray"
      :title="title"
      v-model="selected"
    />
  </v-sheet>
</template>

<script>
  import { VcsList, VcsButton, VcsTextField, Icons } from '@vcmap/ui';
  import {
    VSwitch,
    VDivider,
    VSheet,
    VDialog,
    VCard,
    VForm,
  } from 'vuetify/lib';
  import { computed, ref } from 'vue';

  function getRandomIcon() {
    const keys = Object.keys(Icons);
    const index = Math.floor(keys.length * Math.random());
    return `$${keys[index]}`;
  }

  const defaultItems = [
    {
      name: 'foo',
      title: 'Foo',
      tooltip: 'this is the foo',
      icon: 'mdi-pen',
      selectionChanged: value => console.log('changed cb foo', value),
    },
    {
      name: 'bar',
      title: 'Bar',
      tooltip: 'just a bar',
      actions: [
        {
          name: 'console.log',
          callback() {
            console.log('bar action');
          },
        },
      ],
      selectionChanged: value => console.log('changed cb bar', value),
    },
    {
      name: 'baz',
      title: 'Baz',
      tooltip: 'special baz',
      selectionChanged: value => console.log('bchanged cb baz', value),
    },
  ];

  export default {
    name: 'TestList',
    components: {
      VcsList,
      VcsButton,
      VcsTextField,
      VSwitch,
      VDivider,
      VSheet,
      VDialog,
      VCard,
      VForm,
    },
    setup() {
      const selectable = ref(true);
      const searchable = ref(true);
      const selectSingle = ref(false);
      const showSelection = ref(false);
      const showTitle = ref(true);
      const title = ref('Title');
      const titleActionsArray = ref([]);
      const titleIconSrc = ref(null);
      const selected = ref([]);
      const items = ref(defaultItems);
      const newItem = ref({
        name: 'foo',
        title: 'foo',
        disabled: false,
        visible: true,
        icon: false,
        action: false,
        clicked: false,
        selected: false,
      });
      const dialog = ref(false);

      return {
        selectable,
        searchable,
        selectSingle,
        selected,
        showSelection,
        showTitle,
        title,
        titleActionsArray,
        titleIconSrc,
        items,
        newItem,
        dialog,
        required: [
          v => !!v || 'Input may not be null',
          v => v.length > 0 || 'Input must have a length',
        ],
        add() {
          const item = {
            name: newItem.value.name,
            title: newItem.value.title,
            disabled: newItem.value.disabled,
            visible: newItem.value.visible,
          };

          if (newItem.value.icon) {
            item.icon = getRandomIcon();
          }

          if (newItem.value.action) {
            item.actions = [
              {
                name: 'console.log',
                callback() {
                  console.log('hi, i\'m: ', item.name);
                },
              },
            ];
          }

          if (newItem.value.clicked) {
            item.clicked = () => {
              console.log(`${item.name} just got clicked`);
            };
          }

          if (newItem.value.selected) {
            item.selectionChanged = (selected) => {
              if (selected) {
                console.log(`${item.name} is selected`);
              } else {
                console.log(`${item.name} is no longer selected`);
              }
            };
          }
          items.value.push(item);
          newItem.value = {
            name: 'foo',
            title: 'foo',
            disabled: false,
            visible: true,
            icon: false,
            action: false,
            clicked: false,
            selected: false,
          };
          dialog.value = false;
        },
        titleActions: computed({
          get() {
            return titleActionsArray.value.length > 0;
          },
          set(value) {
            if (value) {
              titleActionsArray.value = [{
                name: 'console.log foo',
                callback() {
                  console.log('foo');
                },
              }];
            } else {
              titleActionsArray.value = [];
            }
          },
        }),
        titleIcon: computed({
          get() {
            return !!titleIconSrc.value;
          },
          set(value) {
            if (value) {
              titleIconSrc.value = getRandomIcon();
            } else {
              titleIconSrc.value = null;
            }
          },
        }),
      };
    },
  };
</script>

<style lang="scss" scoped>

</style>
