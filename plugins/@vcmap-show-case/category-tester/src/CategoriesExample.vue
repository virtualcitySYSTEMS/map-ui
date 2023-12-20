<template>
  <div>
    <v-container class="pa-0">
      <v-expansion-panels
        accordion
        multiple
        v-if="!componentView && componentIds.length > 0"
        class="rounded-0"
      >
        <collection-component-provider
          v-for="componentId in componentIds"
          :component-id="componentId"
          :key="componentId"
        >
          <collection-component @openList="openList" />
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
        <collection-component-list @closeList="closeList" />
        <v-dialog v-model="optionsDialog" width="300">
          <v-card class="pa-2">
            <CollectionComponentOptions />
          </v-card>
        </v-dialog>
      </collection-component-provider>
    </v-container>
    <div class="d-flex gap-2 px-2 pt-2 pb-1">
      <div class="d-flex gap-2 w-full justify-end">
        <VcsFormButton @click="newDialog = true" variant="filled"
          >Request Category</VcsFormButton
        >
        <VcsFormButton @click="requestFoobar">Request Foobar</VcsFormButton>
        <VcsFormButton @click="clear">Clear</VcsFormButton>
      </div>
    </div>
    <v-dialog v-model="itemDialog" width="300">
      <v-card class="pa-2">
        <v-card-title>{{ itemCategoryName }}</v-card-title>
        <v-form @submit.prevent="addItem">
          <vcs-text-area v-model="jsonString" />
          <vcs-form-button type="submit"> Add Item </vcs-form-button>
        </v-form>
      </v-card>
    </v-dialog>
    <v-dialog v-model="newDialog" width="200">
      <v-card class="pa-2">
        <v-form @submit.prevent="requestCategory({ name: categoryName })">
          <VcsTextField
            v-model="categoryName"
            :rules="[(value) => value !== '' || 'Please provide a name!']"
          />
          <VcsFormButton type="submit"> Request </VcsFormButton>
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
    CollectionComponentProvider,
    CollectionComponent,
    CollectionComponentList,
    VcsTextArea,
    createListExportAction,
    createListImportAction,
  } from '@vcmap/ui';
  import {
    VContainer,
    VExpansionPanels,
    VCard,
    VCardTitle,
    VForm,
    VDialog,
  } from 'vuetify/lib';
  import { getObjectFromClassRegistry } from '@vcmap/core';
  import { name as owner } from '../package.json';
  import CollectionComponentOptions from './CollectionComponentOptions.vue';
  import {
    exportCategoryCallback,
    importCategoryCallback,
  } from './importExportHelper.js';

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
      const componentIds = ref(app.categoryManager.componentIds);
      const newDialog = ref(false);
      const optionsDialog = ref(false);
      const itemDialog = ref(false);
      const itemCategoryName = ref(undefined);
      const categoryName = ref('');
      const destroyFunctions = [];

      async function requestCategory(options) {
        if (app.categoryManager.has(options.name)) {
          return app.categoryManager.requestCategory(options, owner);
        }

        const { collectionComponent, category } =
          await app.categoryManager.requestCategory(options, owner);
        collectionComponent.addActions([
          {
            action: {
              name: 'add',
              icon: '$vcsPlus',
              callback() {
                itemDialog.value = true;
                itemCategoryName.value = category.name;
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
        newDialog.value = false;
        return { collectionComponent, category };
      }

      function clear() {
        app.categoryManager.clear();
      }

      async function requestFoobar() {
        const { collectionComponent, category } = await requestCategory({
          name: 'foobar',
          title: 'Foobar',
        });

        app.categoryManager.addMappingFunction(
          () => true,
          foobarMappingFunction,
          owner,
          [collectionComponent.id],
        );
        for (let i = 0; i <= 12; i++) {
          category.collection.add({
            name: `foobar-${i}`,
          });
        }

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

      onUnmounted(() => {
        destroyFunctions.forEach((cb) => cb());
      });

      const jsonString = ref(JSON.stringify({ name: 'newItem' }, null, 2));

      async function addItem() {
        if (itemCategoryName.value) {
          const { category } = await app.categoryManager.requestCategory({
            name: itemCategoryName.value,
          });
          try {
            const config = JSON.parse(jsonString.value);
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
            jsonString.value = JSON.stringify({ name: 'newItem' }, null, 2);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('invalid JSON');
          }
          itemDialog.value = false;
          itemCategoryName.value = undefined;
        }
      }

      /**
       * @type {import("vue").Ref<string|null>}
       */
      const componentView = ref(null);

      return {
        componentIds,
        categoryName,
        newDialog,
        optionsDialog,
        itemDialog,
        itemCategoryName,
        jsonString,
        addItem,
        requestCategory,
        requestFoobar,
        clear,
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
