<template>
  <VcsFormSection
    :heading="title"
    :header-actions="actions"
    :action-button-list-overflow-count="overflowCount"
    v-bind="{ ...$attrs }"
  >
    <collection-component-list
      v-if="componentListView"
      hide-header
      @closeList="closeList"
    />
    <CollectionComponentContent v-else @openList="openList" />
  </VcsFormSection>
</template>

<script>
  import { computed, getCurrentInstance, inject, ref } from 'vue';
  import VcsFormSection from '../../components/form-inputs-controls/VcsFormSection.vue';
  import { createSelectionActions } from '../../components/lists/VcsList.vue';
  import CollectionComponentList from './CollectionComponentList.vue';
  import CollectionComponentContent from './CollectionComponentContent.vue';

  /**
   * @description
   * Renders the first ten items of a collectionComponent in a List. Uses CollectionComponentList to render more items.
   * The collectionComponent must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   */
  export default {
    name: 'CollectionComponent',
    components: {
      CollectionComponentList,
      CollectionComponentContent,
      VcsFormSection,
    },
    setup(_props, { emit }) {
      const vm = getCurrentInstance().proxy;
      /**
       * @type {CollectionComponentClass}
       */
      const collectionComponent = inject('collectionComponent');
      /**
       * @type {import("vue").Ref<boolean>}
       */
      const componentListView = ref(false);

      const selectionActions = createSelectionActions(
        collectionComponent.items,
        collectionComponent.selection,
        emit,
      );

      const actions = collectionComponent.getActions();

      const title = computed(() => {
        if (
          collectionComponent.selectable &&
          collectionComponent.selection.length > 0
        ) {
          return `${vm.$t(collectionComponent.title.value)} (${
            collectionComponent.selection.value.length
          })`;
        }
        return collectionComponent.title.value;
      });

      return {
        title,
        overflowCount: collectionComponent.overflowCount,
        actions: computed(() => {
          if (
            collectionComponent.selectable.value &&
            !collectionComponent.singleSelect.value
          ) {
            return [...selectionActions, ...actions.value];
          }
          return actions.value;
        }),
        componentListView,
        openList() {
          componentListView.value = true;
        },
        closeList() {
          componentListView.value = false;
        },
      };
    },
  };
</script>

<style lang="scss" scoped></style>
