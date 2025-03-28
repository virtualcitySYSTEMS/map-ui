<template>
  <vcs-expansion-panel
    class="collection-component"
    :heading="title"
    :header-actions="actions"
    :action-button-list-overflow-count="overflowCount"
  >
    <template #header-append>
      <span v-if="selectable && selection.length > 0" class="ml-1">
        {{ `(${selection.length})` }}
      </span>
    </template>
    <template #default>
      <CollectionComponentContent @open-list="(id) => $emit('openList', id)" />
    </template>
  </vcs-expansion-panel>
</template>

<script>
  import { computed, inject } from 'vue';
  import VcsExpansionPanel from '../../components/section/VcsExpansionPanel.vue';
  import CollectionComponentContent from './CollectionComponentContent.vue';
  import { createSelectionActions } from '../../components/lists/listHelper.js';

  /**
   * @typedef {Object} FormSectionOptions
   * @property {boolean} [expandable]
   * @property {boolean} [startOpen]
   * @property {boolean} [disabled]
   */

  /**
   * @description
   * Renders content of CollectionComponentClass in an expansion panel using CollectionComponentContent.vue
   * The collectionComponent must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   */
  export default {
    name: 'CollectionComponent',
    components: {
      VcsExpansionPanel,
      CollectionComponentContent,
    },
    props: {
      open: {
        type: Boolean,
        default: false,
      },
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

      return {
        title: collectionComponent.title,
        selection: collectionComponent.selection,
        selectable: collectionComponent.selectable,
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
      };
    },
  };
</script>

<style lang="scss" scoped></style>
