<template>
  <div>
    <v-container class="pa-0">
      <v-expansion-panels
        variant="accordion"
        multiple
        v-if="!componentView && componentIds.length > 0"
        class="rounded-0"
        v-model="panels"
      >
        <collection-component-provider
          v-for="(componentId, index) in componentIds"
          :component-id="componentId"
          :key="componentId"
        >
          <collection-component
            @open-list="openList"
            :open="panels.includes(index)"
          />
          <v-dialog v-model="optionsDialog" width="300">
            <v-card class="pa-2">
              <CollectionComponentOptions />
            </v-card>
          </v-dialog>
        </collection-component-provider>
      </v-expansion-panels>
      <collection-component-provider
        v-if="componentView"
        :component-id="componentView"
      >
        <collection-component-list @close-list="closeList" />
        <v-dialog v-model="optionsDialog" width="300">
          <v-card class="pa-2">
            <CollectionComponentOptions />
          </v-card>
        </v-dialog>
      </collection-component-provider>
    </v-container>
    <div class="d-flex gc-2 px-2 pt-2 pb-1">
      <div class="d-flex gc-2 w-full justify-end">
        <VcsFormButton @click="newCategory.dialog = true" variant="filled"
          >Request Category</VcsFormButton
        >
        <VcsFormButton @click="clear">Clear</VcsFormButton>
      </div>
    </div>
    <v-dialog v-model="newItem.dialog" width="300">
      <v-card class="pa-2">
        <v-card-title>{{ newItem.categoryName }}</v-card-title>
        <v-form @submit.prevent="addItem">
          <vcs-text-area v-model="newItem.config" />
          <vcs-form-button type="submit"> Add Item </vcs-form-button>
        </v-form>
      </v-card>
    </v-dialog>
    <v-dialog v-model="newCategory.dialog" width="200">
      <v-card class="pa-2">
        <v-form @submit.prevent="requestCategory">
          <VcsTextField
            v-model="newCategory.name"
            placeholder="category name"
            :rules="[
              (value) => value !== '' || 'Please provide a name!',
              hasCategory,
            ]"
          />
          <VcsCheckbox
            label="add Foobar items"
            v-model="newCategory.addItems"
          />
          <VcsCheckbox
            label="Add & UI Option actions"
            v-model="newCategory.addActions"
          />
          <VcsCheckbox
            label="Import & Export actions"
            v-model="newCategory.addImportExport"
          />
          <VcsCheckbox
            label="add Foobar Editor"
            v-model="newCategory.addEditors"
          />
          <VcsCheckbox
            label="selection based editors"
            class="mx-2"
            v-if="newCategory.addEditors"
            v-model="newCategory.selectionBased"
          />
          <VcsFormButton type="submit" :disabled="!newCategory.name">
            Request
          </VcsFormButton>
        </v-form>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
  import { inject, onUnmounted, provide, ref } from 'vue';
  import {
    VcsFormButton,
    VcsTextField,
    VcsCheckbox,
    CollectionComponentProvider,
    CollectionComponent,
    CollectionComponentList,
    VcsTextArea,
    createListExportAction,
    createListImportAction,
    makeEditorCollectionComponentClass,
    isEditorCollectionComponentClass,
  } from '@vcmap/ui';
  import {
    VContainer,
    VExpansionPanels,
    VCard,
    VCardTitle,
    VForm,
    VDialog,
  } from 'vuetify/components';
  import { getObjectFromClassRegistry } from '@vcmap/core';
  import { name as owner } from '../package.json';
  import CollectionComponentOptions from './CollectionComponentOptions.vue';
  import {
    exportCategoryCallback,
    importCategoryCallback,
  } from './importExportHelper.js';
  import FoobarEditor from './FoobarEditor.vue';

  const foobarMappingFunction = (item, c, listItem) => {
    listItem.title = item.name;
    listItem.actions.push({ name: 'foobar', callback: () => {} });
  };

  export default {
    name: 'CategoriesExample',
    components: {
      VcsTextArea,
      CollectionComponent,
      CollectionComponentList,
      CollectionComponentProvider,
      CollectionComponentOptions,
      VcsFormButton,
      VcsTextField,
      VcsCheckbox,
      VContainer,
      VExpansionPanels,
      VCard,
      VCardTitle,
      VForm,
      VDialog,
    },
    setup(props, { attrs }) {
      const app = inject('vcsApp');
      provide('collectionManager', app.categoryManager);
      const componentIds = ref([]);
      const destroyFunctions = [];
      const panels = ref([]);

      const newCategory = ref({
        dialog: false,
        name: '',
        addItems: false,
        addActions: false,
        addImportExport: false,
        addEditors: false,
        selectionBased: false,
      });

      const newItem = ref({
        dialog: false,
        categoryName: undefined,
        config: JSON.stringify({ name: 'newItem' }, null, 2),
      });

      const optionsDialog = ref(false);

      function addItems(collectionComponent, category) {
        app.categoryManager.addMappingFunction(
          () => true,
          foobarMappingFunction,
          owner,
          [collectionComponent.id],
        );
        for (let i = 0; i <= 12; i++) {
          collectionComponent.collection.add({
            name: `${category.name}-${i}`,
            title: `${category.name}-${i}-title`,
            random: Math.random(),
          });
        }
      }

      function addActions(collectionComponent, category) {
        collectionComponent.addActions([
          {
            action: {
              name: 'add',
              icon: '$vcsPlus',
              callback() {
                newItem.value.dialog = true;
                newItem.value.categoryName = category.name;
              },
            },
            owner,
          },
          {
            action: {
              name: 'Category Options',
              callback() {
                optionsDialog.value = true;
              },
            },
            owner,
          },
        ]);
      }

      function addImportExportActions(collectionComponent, category) {
        const { action: exportAction, destroy: exportDestroy } =
          createListExportAction(
            collectionComponent.selection,
            () => exportCategoryCallback(app, collectionComponent, category),
            owner,
          );

        const { action: importAction, destroy: importDestroy } =
          createListImportAction(
            (files) => importCategoryCallback(app, files),
            app.windowManager,
            owner,
            attrs['window-state'].id,
          );

        destroyFunctions.push(exportDestroy, importDestroy);
        collectionComponent.addActions([exportAction, importAction]);
      }

      function addEditors(collectionComponent, category, selectionBased) {
        collectionComponent.selectable.value = true;

        function getItemForListItem(listItem) {
          return collectionComponent.collection.getByKey(listItem.name);
        }

        makeEditorCollectionComponentClass(
          app,
          collectionComponent,
          {
            editor: (item) => ({
              component: FoobarEditor,
              state: {
                headerTitle: `${category.name} Editor`,
                headerIcon: '$vcsEdit',
              },
              position: {
                width: 300,
              },
              props: {
                async getConfig() {
                  return (
                    collectionComponent.collection.getSerializedByKey?.(
                      item.name,
                    ) ?? collectionComponent.collection.getByKey(item.name)
                  );
                },
                setConfig(config) {
                  item.name = config.name ?? item.name;
                  item.title = config.title ?? item.title;
                  item.random = config.random ?? item.random;
                },
              },
            }),
            multiEditor: {
              component: FoobarEditor,
              state: {
                headerTitle: `${category.name} Multi Editor`,
                headerIcon: '$vcsPen',
              },
              position: {
                width: 300,
              },
              props: {
                multi: true,
                selection: collectionComponent.selection,
                getConfig() {
                  const selection =
                    collectionComponent.selection.value.map(getItemForListItem);
                  if (
                    selection.every((i) => i.random === selection[0].random)
                  ) {
                    return selection[0];
                  }
                  return { random: undefined };
                },
                setConfig(config) {
                  collectionComponent.selection.value
                    .map(getItemForListItem)
                    .forEach((i) => {
                      i.random = config.random ?? i.random;
                    });
                },
              },
            },
            selectionBased,
          },
          attrs['window-state'].id,
        );
      }

      function clear() {
        componentIds.value
          .map((id) => app.categoryManager.get(id))
          .forEach((c) => {
            if (c[isEditorCollectionComponentClass]) {
              c.closeEditorWindows();
              c.closeMultiEditorWindow();
            }
            app.categoryManager.remove(c.id);
          });
        componentIds.value.splice(0);
      }

      onUnmounted(() => {
        destroyFunctions.forEach((cb) => cb());
        clear();
      });

      async function addItem() {
        if (newItem.value.categoryName) {
          const { category } = await app.categoryManager.requestCategory({
            name: newItem.value.categoryName,
          });
          try {
            const config = JSON.parse(newItem.value.config);
            if (category.classRegistryName) {
              category.collection.add(
                getObjectFromClassRegistry(
                  app[category.classRegistryName],
                  config,
                ),
              );
            } else {
              category.collection.add(config);
            }
          } catch (e) {
            console.error('invalid JSON');
          }
          newItem.value.dialog = false;
          newItem.value.categoryName = undefined;
          newItem.value.config = JSON.stringify({ name: 'newItem' }, null, 2);
        }
      }

      /**
       * @type {import("vue").Ref<string|null>}
       */
      const componentView = ref(null);

      return {
        componentIds,
        newCategory,
        newItem,
        optionsDialog,
        panels,
        addItem,
        async requestCategory() {
          const { collectionComponent, category } =
            await app.categoryManager.requestCategory(
              { name: newCategory.value.name },
              owner,
            );
          componentIds.value.push(collectionComponent.id);
          if (newCategory.value.addItems) {
            addItems(collectionComponent, category);
          }
          if (newCategory.value.addActions) {
            addActions(collectionComponent, category);
          }
          if (newCategory.value.addImportExport) {
            addImportExportActions(collectionComponent, category);
          }
          if (newCategory.value.addEditors) {
            addEditors(
              collectionComponent,
              category,
              newCategory.value.selectionBased,
            );
          }
          newCategory.value.name = '';
          newCategory.value.dialog = false;
        },
        clear,
        hasCategory(value) {
          return !app.categoryManager.has(value) || 'Category already existing';
        },
        componentView,
        openList(id) {
          componentView.value = id;
        },
        closeList() {
          componentView.value = null;
        },
      };
    },
  };
</script>

<style scoped></style>
