<template>
  <v-container class="py-0 px-2">
    <v-row no-gutters>
      <v-col>
        <VcsLabel html-for="title">
          {{ $t('categoryTester.title') }}
        </VcsLabel>
      </v-col>
      <v-col>
        <VcsTextField id="title" clearable v-model="title" />
      </v-col>
    </v-row>
    <v-row no-gutters v-for="key in keys" :key="key">
      <v-col>
        <VcsLabel :html-for="key">
          {{ $st(`categoryTester.${key}`) }}
        </VcsLabel>
      </v-col>
      <v-col>
        <VcsCheckbox
          :id="key"
          :model-value="localOptions[key]"
          @update:model-value="(v) => updateOption(key, v)"
        />
      </v-col>
    </v-row>
    <v-row no-gutters>
      <v-col>
        <VcsLabel>{{ $st(`pagination`) }}</VcsLabel>
      </v-col>
      <v-col>
        <VcsCheckbox v-model="pagination" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import { inject, isRef, reactive, watch, ref } from 'vue';
  import { VContainer, VRow, VCol } from 'vuetify/components';
  import { VcsCheckbox, VcsLabel, VcsTextField } from '@vcmap/ui';
  import { Collection } from '@vcmap/core';

  /**
   * Shows CollectionComponentOptions of a provided collectionComponent
   */
  export default {
    name: 'CollectionComponentOptions',
    components: {
      VcsCheckbox,
      VcsLabel,
      VcsTextField,
      VContainer,
      VRow,
      VCol,
    },
    props: {},
    setup() {
      /** @type {import("@vcmap/ui").CollectionComponentClass} */
      const collectionComponent = inject('collectionComponent');
      const localOptions = reactive({
        draggable: collectionComponent.draggable,
        selectable: collectionComponent.selectable,
        singleSelect: collectionComponent.singleSelect,
        renamable: collectionComponent.renamable,
        removable: collectionComponent.removable,
      });
      // clone is for demonstration purposes only: caches the original items while pagination is active.
      const collectionClone = new Collection();
      const pagination = ref(!!collectionComponent.pagination.value);
      watch(pagination, (value) => {
        if (value) {
          collectionClone.clear();
          [...collectionComponent.collection].forEach((item) => {
            collectionClone.add(item);
          });
          collectionComponent.setPagination({
            // just for demonstration purposes -> get Items should fetch items from server.
            getItems(startIndex, count) {
              return {
                items: [...collectionClone].slice(
                  startIndex,
                  count + startIndex,
                ),
                total: collectionClone.size,
              };
            },
          });
        } else {
          collectionComponent.setPagination(undefined);
          [...collectionClone].forEach((item) => {
            collectionComponent.collection.add(item);
          });
        }
      });
      return {
        title: collectionComponent.title,
        keys: Object.keys(localOptions),
        localOptions,
        updateOption(key, value) {
          localOptions[key] = value;
          if (isRef(collectionComponent[key])) {
            collectionComponent[key].value = value;
          } else {
            collectionComponent[key] = value;
          }
        },
        pagination,
      };
    },
  };
</script>

<style lang="scss" scoped></style>
