<template>
  <div>
    <div class="v-expansion-panel-header px-2 v-expansion-panel-header--active">
      <div class="d-flex justify-space-between">
        <div class="d-flex align-center gap-1 pl-2">
          <span>
            {{ $t(title) }}
          </span>
          <span v-if="selectable && selection.length > 0">
            {{ `(${selection.length})` }}
          </span>
        </div>
        <VcsActionButtonList
          v-if="actions?.length > 0"
          :actions="actions"
          :overflow-count="overflowCount"
        />
      </div>
    </div>
    <vcs-list
      :items="items"
      :draggable="draggable"
      :selectable="selectable"
      :single-select="singleSelect"
      v-model="selection"
      :show-title="false"
      @item-moved="move"
    />
    <v-sheet v-if="showLessButton" class="ma-2 pl-2">
      <VcsButton @click="closeList">
        {{ $t('collectionManager.less') }}
      </VcsButton>
    </v-sheet>
  </div>
</template>

<script>
  import { computed, inject } from 'vue';
  import { IndexedCollection } from '@vcmap/core';
  import { VSheet } from 'vuetify/lib';
  import VcsList, {
    createSelectionActions,
  } from '../../components/lists/VcsList.vue';
  import VcsActionButtonList from '../../components/buttons/VcsActionButtonList.vue';
  import VcsButton from '../../components/buttons/VcsButton.vue';

  /**
   * Moves an item to a new position.
   * New position is derived from a target item in the collection.
   * This ensures correct movement, if rendered list is only a subset of the collection.
   * @param {CollectionComponentClass} collectionComponent
   * @param {VcsListItem} item
   * @param {number} targetIndex
   */
  export function moveItem(collectionComponent, item, targetIndex) {
    const { collection } = collectionComponent;
    if (collection instanceof IndexedCollection) {
      const collectionItem = collection.getByKey(item.name);
      const keyProperty = collection.uniqueKey;
      const targetItem = collectionComponent.items.value[targetIndex];
      const targetIndexCol = [...collection].findIndex(
        (i) => i[keyProperty] === targetItem.name,
      );
      collection.moveTo(collectionItem, targetIndexCol);
    }
  }

  /**
   * @description
   * Renders the items of a CollectionComponentClass in a List.
   * The collectionComponent must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   * @vue-prop {string} showLessButton - Show a `show less button` at the end of the list, which will emit a closeList event
   */
  export default {
    name: 'CollectionComponentList',
    props: {
      showLessButton: {
        type: Boolean,
        default: true,
      },
    },
    components: {
      VcsButton,
      VcsActionButtonList,
      VcsList,
      VSheet,
    },
    setup(_props, { emit }) {
      /**
       * @type {import("./collectionComponentClass.js").CollectionComponentClass}
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
        closeList() {
          emit('closeList', collectionComponent.id);
        },
      };
    },
  };
</script>

<style lang="scss" scoped></style>
