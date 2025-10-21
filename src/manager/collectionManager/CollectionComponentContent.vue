<template>
  <v-container class="py-0 px-0 collection-component-content">
    <vcs-list
      :items="items.slice(0, limit)"
      :draggable="draggable"
      :selectable="selectable"
      :single-select="singleSelect"
      v-model="selection"
      :show-title="false"
      @item-moved="move"
    />
    <v-sheet v-if="page && pageSize && totalCount && items.length !== 0">
      <v-pagination
        class="px-2"
        v-model="page"
        :length="Math.ceil(totalCount / pageSize)"
        density="compact"
      ></v-pagination>
    </v-sheet>
    <v-sheet v-else-if="items.length > limit" class="ma-2 pl-2">
      <VcsButton @click="openCollectionComponentList">
        {{ $t('collectionManager.more') }}
      </VcsButton>
    </v-sheet>
    <v-sheet v-else-if="items.length === 0" class="ma-2 pl-2">
      {{ $t('collectionManager.empty') }}
    </v-sheet>
  </v-container>
</template>

<script>
  import { computed, inject, onUnmounted, ref, watch } from 'vue';
  import { VSheet, VContainer, VPagination } from 'vuetify/components';
  import { getLogger } from '@vcsuite/logger';
  import { createSelectionActions } from '../../components/lists/listHelper.js';
  import VcsList from '../../components/lists/VcsList.vue';
  import VcsButton from '../../components/buttons/VcsButton.vue';
  import { moveItem } from './CollectionComponentList.vue';

  /**
   * @description
   * Renders the first ten items of a collectionComponent in a List. Uses CollectionComponentList to render more items.
   * The collectionComponent must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   * @vue-event {string} openList
   */
  export default {
    name: 'CollectionComponentContent',
    components: {
      VcsButton,
      VcsList,
      VSheet,
      VContainer,
      VPagination,
    },
    emits: ['openList'],
    setup(_props, { emit }) {
      /**
       * @type {CollectionComponentClass}
       */
      const collectionComponent = inject('collectionComponent');

      const selectionActions = createSelectionActions(
        collectionComponent.items,
        collectionComponent.selection,
        emit,
      );

      const actions = collectionComponent.getActions();

      const { pagination } = collectionComponent;
      const page = ref();
      const pageSize = ref();
      const totalCount = ref();
      let destroyPaginationListeners;

      async function updatePagination() {
        destroyPaginationListeners?.();
        if (pagination.value && !pagination.value.initialized) {
          await pagination.value.initialize();
        }

        page.value = pagination.value?.getPage();
        pageSize.value = pagination.value?.getPageSize();
        totalCount.value = pagination.value?.totalCount;
        const listeners = [
          pagination.value?.pageChanged.addEventListener((newPage) => {
            page.value = newPage;
          }),
          pagination.value?.pageSizeChanged.addEventListener((newPageSize) => {
            pageSize.value = newPageSize;
          }),
        ];
        destroyPaginationListeners = () => {
          listeners.forEach((l) => l?.());
        };
      }

      if (pagination.value) {
        updatePagination().catch((e) => {
          getLogger('CollectionComponentContent').error(
            'setting up pagination failed',
            e,
          );
        });
      }

      onUnmounted(() => {
        destroyPaginationListeners?.();
      });

      watch(pagination, async () => {
        await updatePagination();
      });

      watch(page, async () => {
        if (pagination.value && page.value !== pagination.value.getPage()) {
          await pagination.value.setPage(page.value);
        }
      });

      return {
        title: collectionComponent.title,
        items: collectionComponent.items,
        selection: collectionComponent.selection,
        draggable: collectionComponent.draggable,
        selectable: collectionComponent.selectable,
        singleSelect: collectionComponent.singleSelect,
        overflowCount: collectionComponent.overflowCount,
        limit: collectionComponent.limit,
        actions: computed(() => {
          if (
            collectionComponent.selectable.value &&
            !collectionComponent.singleSelect.value
          ) {
            return [...selectionActions, ...actions.value];
          }
          return actions.value;
        }),
        move(event) {
          moveItem(collectionComponent, event);
        },
        openCollectionComponentList() {
          emit('openList', collectionComponent.id);
        },
        page,
        pageSize,
        totalCount,
      };
    },
  };
</script>

<style lang="scss" scoped>
  :deep(.v-list) {
    .v-list-item {
      padding-left: 24px;
      padding-inline-start: 24px !important;
    }
    .v-list-item__selected {
      padding-left: 20px !important;
      padding-inline-start: 20px !important;
    }
  }
</style>
