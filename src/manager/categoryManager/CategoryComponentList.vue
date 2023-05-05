<template>
  <vcs-list
    :items="category.items"
    :draggable="category.draggable"
    :selectable="category.selectable"
    :single-select="category.singleSelect"
    v-model="selection"
    :title="category.title"
    @item-moved="move"
  />
</template>

<script>
  import { computed, inject, watch } from 'vue';
  import { IndexedCollection } from '@vcmap/core';
  import VcsList from '../../components/lists/VcsList.vue';

  export default {
    name: 'CategoryComponenList',
    components: {
      VcsList,
    },
    props: {
      category: {
        type: Object,
        required: true,
      },
      windowId: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      /** @type {VcsUiApp} */
      const app = inject('vcsApp');

      const selection = computed({
        get() {
          return props.category.selection;
        },
        set(value) {
          // eslint-disable-next-line vue/no-mutating-props
          props.category.selection = value;
        },
      });

      watch(app.categoryManager.componentIds, () => {
        if (!app.categoryManager.get(props.category.id)) {
          app.windowManager.remove(props.windowId);
        }
      });

      const { collection } = app.categories.getByKey(
        props.category.categoryName,
      );
      /**
       * index of the first item within the collection
       * @type {ComputedRef<number>}
       */
      const collectionItemOffset = computed(() => {
        return [...collection].findIndex(
          (i) => i[collection.uniqueKey] === props.category.items[0]?.id,
        );
      });

      return {
        selection,
        move({ item, targetIndex }) {
          if (collection instanceof IndexedCollection) {
            const collectionItem = collection.getByKey(item.id);
            collection.moveTo(
              collectionItem,
              targetIndex + collectionItemOffset.value,
            );
          }
        },
      };
    },
  };
</script>

<style lang="scss" scoped>
  ::v-deep {
    .v-list .v-list-item__action {
      min-width: auto;
    }
  }
</style>
