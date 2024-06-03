<template>
  <v-container class="py-0 px-0">
    <vcs-list
      :items="items.slice(0, limit)"
      :draggable="draggable"
      :selectable="selectable"
      :single-select="singleSelect"
      v-model="selection"
      :show-title="false"
      @item-moved="move"
    />
    <v-sheet v-if="items.length > limit" class="ma-2 pl-2">
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
  import { computed, inject } from 'vue';
  import { VSheet, VContainer } from 'vuetify/components';
  import VcsList, {
    createSelectionActions,
  } from '../../components/lists/VcsList.vue';
  import VcsButton from '../../components/buttons/VcsButton.vue';
  import { moveItem } from './CollectionComponentList.vue';

  /**
   * @description
   * Renders the first ten items of a collectionComponent in a List. Uses CollectionComponentList to render more items.
   * The collectionComponent must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   * @vue-event {string} openList
   */
  export default {
    name: 'CollectionComponent',
    components: {
      VcsButton,
      VcsList,
      VSheet,
      VContainer,
    },
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
        move({ item, targetIndex }) {
          moveItem(collectionComponent, item, targetIndex);
        },
        openCollectionComponentList() {
          emit('openList', collectionComponent.id);
        },
      };
    },
  };
</script>

<style lang="scss" scoped>
  :deep(.v-list) {
    .v-list-item {
      padding: 4px 8px 4px 28px;
    }
    .v-list-item__selected {
      border-left: solid 4px;
      border-left-color: var(--v-primary-base);
      padding-left: 24px !important;
    }
  }
</style>
