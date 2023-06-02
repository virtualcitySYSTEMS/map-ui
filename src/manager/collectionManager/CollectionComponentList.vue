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
          if (collectionComponent.collection instanceof IndexedCollection) {
            const collectionItem = collectionComponent.collection.getByKey(
              item.id,
            );
            collectionComponent.collection.moveTo(
              collectionItem,
              targetIndex, // collectionItemOffset.value for paginated lists?
            );
          }
        },
      };
    },
  };
</script>

<style lang="scss" scoped></style>
