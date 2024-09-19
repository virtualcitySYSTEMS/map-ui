<template>
  <v-sheet>
    <VcsFormSection heading="Settings">
      <v-container class="py-0 px-4">
        <v-row no-gutters>
          <v-col>
            <v-switch v-model="selectable" label="Selectable" />
          </v-col>
          <v-col>
            <v-switch
              :disabled="!selectable"
              v-model="selectSingle"
              label=" Single Select"
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <v-switch v-model="searchable" label="Searchable" />
          </v-col>
          <v-col>
            <v-switch v-model="draggable" label="Draggable" />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <v-switch
              v-model="prependIndex"
              label="Prepend Index"
              class="ma-0"
            />
          </v-col>
          <v-col>
            <v-switch v-model="appendIndex" label="Append Index" />
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>
    <VcsFormSection heading="Title">
      <v-container class="py-0 px-4">
        <v-row no-gutters>
          <v-col>
            <v-switch v-model="showTitle" label="Show Title" />
          </v-col>
          <v-col>
            <vcs-text-field
              v-model="title"
              placeholder="Title"
              :disabled="!showTitle"
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <v-switch
              v-model="titleActions"
              label="Title Actions"
              class="ma-0"
            />
          </v-col>
          <v-col>
            <v-switch v-model="titleIcon" label="Title Icon" class="ma-0" />
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>
    <VcsFormSection heading="Item">
      <v-container class="py-2 px-4">
        <v-row no-gutters>
          <v-dialog v-model="dialog" width="400">
            <template #activator="{ props }">
              <vcs-form-button v-bind="props"> Add An item </vcs-form-button>
            </template>
            <v-card class="py-2 px-4">
              <v-form @submit.prevent="add">
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
                <v-switch label="hasUpdate" v-model="newItem.hasUpdate" />
                <v-switch label="rename action" v-model="newItem.renamable" />
                <v-switch
                  label="toggle rename action"
                  v-model="newItem.toggleRename"
                />
                <v-switch label="console.log action" v-model="newItem.action" />
                <v-switch
                  label="console.log on clicked"
                  v-model="newItem.clicked"
                />
                <v-switch
                  label="console.log selected state"
                  v-model="newItem.selected"
                />
                <vcs-form-button type="submit"> Add </vcs-form-button>
              </v-form>
            </v-card>
          </v-dialog>
        </v-row>
      </v-container>
    </VcsFormSection>
    <VcsFormSection heading="Selection">
      <v-container class="py-2 px-4">
        <v-row no-gutters>
          <template v-if="selectable">
            <v-col>
              <v-switch
                v-model="showSelection"
                label="Show Selection"
                dense
                class="ma-0"
              />
            </v-col>
          </template>
        </v-row>
        <v-row no-gutters>
          <ul v-if="showSelection" class="mx-2">
            <li v-for="(i, index) in selected" :key="`item-${index}`">
              {{ i.title }}
            </li>
          </ul>
        </v-row>
      </v-container>
    </VcsFormSection>

    <vcs-list
      :items="items"
      :draggable="draggable"
      :selectable="selectable"
      :single-select="selectSingle"
      :searchable="searchable"
      :show-title="showTitle"
      :icon="titleIconSrc"
      :actions="titleActionsArray"
      :title="title"
      v-model="selected"
      @item-moved="move"
      @item-renamed="({ item, newTitle }) => (item.title = newTitle)"
    >
      <template #[`item.prepend`]="{ index }" v-if="prependIndex">
        {{ index }}
      </template>
      <template #[`item.title`]="{ index }">
        {{ index }}
      </template>
      <template #[`item.append`]="{ index }" v-if="appendIndex">
        {{ index }}
      </template>
    </vcs-list>
  </v-sheet>
</template>

<script>
  import {
    VcsList,
    VcsFormButton,
    VcsTextField,
    Icons,
    VcsFormSection,
  } from '@vcmap/ui';
  import {
    VSwitch,
    VSheet,
    VDialog,
    VCard,
    VForm,
    VContainer,
    VRow,
    VCol,
  } from 'vuetify/components';
  import { computed, reactive, ref } from 'vue';

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
      tooltip: 'special baz',
      selectionChanged: (value) => console.log('bchanged cb baz', value),
    },
  ];

  export default {
    name: 'ListExample',
    components: {
      VcsList,
      VcsFormButton,
      VcsTextField,
      VcsFormSection,
      VSwitch,
      VSheet,
      VDialog,
      VCard,
      VForm,
      VContainer,
      VRow,
      VCol,
    },
    setup() {
      const draggable = ref(true);
      const selectable = ref(true);
      const searchable = ref(true);
      const selectSingle = ref(false);
      const showSelection = ref(false);
      const prependIndex = ref(false);
      const appendIndex = ref(false);
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
        renamable: false,
        toggleRename: false,
        action: false,
        clicked: false,
        selected: false,
      });
      const dialog = ref(false);

      return {
        draggable,
        selectable,
        searchable,
        selectSingle,
        selected,
        showSelection,
        prependIndex,
        appendIndex,
        showTitle,
        title,
        titleActionsArray,
        titleIconSrc,
        items,
        newItem,
        dialog,
        required: [
          (v) => !!v || 'Input may not be null',
          (v) => v.length > 0 || 'Input must have a length',
        ],
        add() {
          const item = reactive({
            name: newItem.value.name,
            title: newItem.value.title,
            disabled: newItem.value.disabled,
            visible: newItem.value.visible,
            hasUpdate: newItem.value.hasUpdate,
            renamable: newItem.value.renamable,
          });

          if (newItem.value.icon) {
            item.icon = getRandomIcon();
          }

          item.actions = [];

          if (newItem.value.toggleRename) {
            item.actions.push({
              name: 'toggle rename',
              callback() {
                item.renamable = !item.renamable;
              },
            });
          }

          if (newItem.value.action) {
            item.actions.push({
              name: 'console.log',
              callback() {
                console.log("hi, i'm: ", item.name);
              },
            });
          }

          if (newItem.value.clicked) {
            item.clickedCallbacks = [
              () => {
                console.log(`${item.name} just got clicked`);
              },
            ];
          }

          if (newItem.value.selected) {
            item.selectionChanged = (selectedValue) => {
              if (selectedValue) {
                console.log(`${item.name} is selected`);
              } else {
                console.log(`${item.name} is no longer selected`);
              }
            };
          }

          if (newItem.value.renamable) {
            item.titleChanged = (newTitle) => {
              item.title = newTitle;
            };
          }

          items.value.push(item);
          newItem.value = {
            name: 'foo',
            title: 'foo',
            disabled: false,
            visible: true,
            icon: false,
            renamable: false,
            action: false,
            clicked: false,
            selected: false,
            hasUpdate: false,
          };
          dialog.value = false;
        },
        titleActions: computed({
          get() {
            return titleActionsArray.value.length > 0;
          },
          set(value) {
            if (value) {
              titleActionsArray.value = [
                {
                  name: 'console.log foo',
                  callback() {
                    console.log('foo');
                  },
                },
              ];
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
        move({ item, targetIndex }) {
          let target = targetIndex;
          target = target >= 0 ? target : 0;
          target =
            target < items.value.length ? target : items.value.length - 1;
          const from = items.value.indexOf(item);
          if (from !== target) {
            items.value.splice(from, 1);
            items.value.splice(target, 0, item);
          }
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
