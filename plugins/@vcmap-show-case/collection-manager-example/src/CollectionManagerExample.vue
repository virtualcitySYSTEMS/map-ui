<template>
  <div>
    <VcsFormSection heading="Collection Manager" v-if="componentIds.length > 0">
      <CollectionManagerComponent />
    </VcsFormSection>
    <VcsFormSection heading="Tester Settings">
      <v-container class="py-0 px-1">
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
          <VcsFormButton @click="clear">Clear</VcsFormButton>
        </div>
      </v-container>
    </VcsFormSection>
  </div>
</template>

<script>
  import { inject, onMounted, onUnmounted, ref } from 'vue';
  import {
    VcsFormSection,
    CollectionManagerComponent,
    VcsFormButton,
    VcsSelect,
    VcsLabel,
    NotificationType,
  } from '@vcmap/ui';
  import { VContainer, VRow, VCol } from 'vuetify/lib';
  import { name as owner } from '../package.json';

  /**
   * a sample mapping function adding a console log to all list items
   * @param {T} i
   * @param {CollectionComponent} c
   * @param {VcsListItem} l
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

  export default {
    name: 'CollectionManagerExample',
    components: {
      VcsFormSection,
      CollectionManagerComponent,
      VcsFormButton,
      VcsLabel,
      VcsSelect,
      VContainer,
      VRow,
      VCol,
    },
    setup() {
      const app = inject('vcsApp');
      const collectionManager = inject('collectionManager');
      const componentIds = ref(collectionManager.componentIds);
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

      function clear() {
        collectionManager.clear();
      }

      return {
        componentIds,
        appCollections,
        selected,
        addCollection,
        clear,
      };
    },
  };
</script>

<style scoped></style>
