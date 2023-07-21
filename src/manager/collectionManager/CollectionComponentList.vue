<template>
  <vcs-list
    :items="items"
    :draggable="draggable"
    :selectable="selectable"
    :single-select="singleSelect"
    v-model="selection"
    :title="title"
    @item-moved="move"
  />
</template>

<script>
  import { inject } from 'vue';
  import { IndexedCollection } from '@vcmap/core';
  import VcsList from '../../components/lists/VcsList.vue';

  /**
   * Moves an item to a new position.
   * New position is derived from a target item in the collection.
   * This ensures correct movement, if rendered list is only a subset of the collection.
   * @param {CollectionComponent} collectionComponent
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
        (i) => i[keyProperty] === targetItem[keyProperty],
      );
      collection.moveTo(collectionItem, targetIndexCol);
    }
  }

  /**
   * Renders the items of a CollectionComponent in a List.
   * The collectionComponent must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   */
  export default {
    name: 'CollectionComponentList',
    components: {
      VcsList,
    },
    props: {
      windowId: {
        type: String,
        required: true,
      },
    },
    setup() {
      /**
       * @type {CollectionComponent}
       */
      const collectionComponent = inject('collectionComponent');

      return {
        title: collectionComponent.title,
        items: collectionComponent.items,
        selection: collectionComponent.selection,
        draggable: collectionComponent.draggable,
        selectable: collectionComponent.selectable,
        singleSelect: collectionComponent.singleSelect,
        move({ item, targetIndex }) {
          moveItem(collectionComponent, item, targetIndex);
        },
      };
    },
  };
</script>

<style lang="scss" scoped></style>
