<template>
  <div>
    <CollectionComponentStandalone />
    <VcsFormSection heading="Collection Manager" :header-actions="actions">
      <CollectionManagerComponent />
      <p v-if="componentIds.length < 1" class="pa-1">
        Add a collection by clicking +
      </p>
      <v-dialog v-model="addDialog" width="400">
        <v-card>
          <v-container>
            <v-row no-gutters>
              <v-col>
                <VcsLabel html-for="selectInput" dense>
                  {{ $t('collectionManagerExample.select') }}
                </VcsLabel>
              </v-col>
              <v-col>
                <VcsSelect
                  id="selectInput"
                  :items="appCollections"
                  dense
                  v-model="selected"
                />
              </v-col>
            </v-row>
            <div class="d-flex gap-2 w-full justify-end">
              <VcsFormButton @click="addCollection" variant="filled"
                >Add Collection</VcsFormButton
              >
            </div>
          </v-container>
        </v-card>
      </v-dialog>
    </VcsFormSection>
  </div>
</template>

<script>
  import { inject, onMounted, onUnmounted, provide, ref } from 'vue';
  import {
    CollectionComponentClass,
    CollectionComponentStandalone,
    CollectionManagerComponent,
    NotificationType,
    VcsFormButton,
    VcsFormSection,
    VcsLabel,
    VcsSelect,
  } from '@vcmap/ui';
  import { VCol, VContainer, VRow, VCard, VDialog } from 'vuetify/components';
  import { Collection } from '@vcmap/core';
  import { name as owner } from '../package.json';

  /**
   * a sample mapping function adding a console log to all list items
   * @param {T} i
   * @param {import("@vcmap/ui").CollectionComponentClass} c
   * @param {import("@vcmap/ui").VcsListItem} l
   */
  const mappingFunction = (i, c, l) => {
    l.actions = [
      ...l.actions,
      {
        name: 'console.log',
        title: 'log item, collectionComponent and listItem',
        icon: 'mdi-printer',
        callback: () => console.log(i, c, l),
      },
    ];
  };

  function setupCollectionComponentStandalone() {
    const collectionComponent = new CollectionComponentClass({
      id: 'standalone',
      title: 'Collection Component Standalone',
      collection: new Collection(),
      renamable: true,
    });

    for (let i = 0; i <= 12; i++) {
      collectionComponent.collection.add({
        name: `item-${i}`,
        properties: {
          title: `item-${i}-title`,
        },
        random: Math.random(),
      });
    }

    collectionComponent.addActions([
      {
        action: {
          name: 'add',
          icon: '$vcsPlus',
          callback() {
            const i = collectionComponent.collection.size;
            collectionComponent.collection.add({
              name: `item-${i}`,
              properties: {
                title: `item-${i}-title`,
              },
              random: Math.random(),
            });
          },
        },
        owner,
      },
    ]);

    return collectionComponent;
  }

  export default {
    name: 'CollectionManagerExample',
    components: {
      VcsFormSection,
      CollectionManagerComponent,
      CollectionComponentStandalone,
      VcsFormButton,
      VcsLabel,
      VcsSelect,
      VContainer,
      VRow,
      VCol,
      VCard,
      VDialog,
    },
    setup() {
      const app = inject('vcsApp');
      const collectionManager = inject('collectionManager');
      const appCollections = [
        'maps',
        'layers',
        'obliqueCollections',
        'styles',
        'featureInfo',
        'plugins',
        'viewpoints',
      ];
      const selected = ref(appCollections[0]);
      const addDialog = ref(false);

      const collectionComponentStandalone =
        setupCollectionComponentStandalone();
      // provide for <CollectionComponentStandalone>
      provide('collectionComponent', collectionComponentStandalone);

      onMounted(() => {
        /**
         * add general mapping function applied to all collections
         */
        collectionManager.addMappingFunction(
          () => true,
          mappingFunction,
          owner,
        );
      });

      onUnmounted(() => {
        collectionManager.removeMappingFunction(mappingFunction, owner);
      });

      /**
       * add item filter to collection of provided id
       * @param {string} id
       */
      function addFilterActions(id) {
        /**
         * Filters all items having an 'a' within title or name
         * @param {T} item
         * @returns {boolean}
         */
        const filterFunction = (item) =>
          item?.properties?.title?.includes('a') || item.name.includes('a');
        collectionManager.addActions(
          [
            {
              name: 'addFilter',
              title: 'show only items including an "a" in title or name',
              icon: 'mdi-filter-plus',
              callback: () => {
                collectionManager.addFilterFunction(filterFunction, owner, [
                  id,
                ]);
              },
            },
            {
              name: 'removeFilter',
              title: 'remove filtering',
              icon: 'mdi-filter-remove',
              callback: () => {
                collectionManager.removeFilterFunction(filterFunction, owner);
              },
            },
          ],
          owner,
          [id],
        );
      }

      /**
       * add new collection to manager
       */
      function addCollection() {
        if (!collectionManager.has(selected.value)) {
          collectionManager.add(
            {
              id: selected.value,
              title: selected.value,
              collection: app[selected.value],
              renamable: true,
            },
            owner,
          );
          addFilterActions(selected.value);
        } else {
          app.notifier.add({
            message: 'collectionManagerExample.addFailed',
            type: NotificationType.ERROR,
          });
        }
      }

      const actions = [
        {
          name: 'collectionManagerExample.addAction',
          title: 'collectionManagerExample.addAction',
          icon: '$vcsPlus',
          callback() {
            addDialog.value = true;
          },
        },
        {
          name: 'collectionManagerExample.clearAction',
          title: 'collectionManagerExample.clearAction',
          callback() {
            collectionManager.clear();
          },
        },
      ];

      return {
        componentIds: collectionManager.componentIds,
        appCollections,
        selected,
        addCollection,
        addDialog,
        actions,
      };
    },
  };
</script>

<style scoped></style>
