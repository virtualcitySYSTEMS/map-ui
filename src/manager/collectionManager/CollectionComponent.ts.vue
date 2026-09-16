<template>
  <VcsExpansionPanel
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
      <CollectionComponentContent
        @open-list="(id: string) => $emit('openList', id)"
      />
    </template>
  </VcsExpansionPanel>
</template>

<script lang="ts">
  import { computed, defineComponent, inject } from 'vue';
  import VcsExpansionPanel from '../../components/section/VcsExpansionPanel.ts.vue';
  import CollectionComponentContent from './CollectionComponentContent.ts.vue';
  import { createSelectionActions } from '../../components/lists/listHelper.js';
  import type CollectionComponentClass from './collectionComponentClass.js';

  /**
   * @description
   * Renders content of CollectionComponentClass in an expansion panel using CollectionComponentContent.ts.vue
   * The collectionComponent must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   */
  export default defineComponent({
    name: 'CollectionComponent',
    components: {
      VcsExpansionPanel,
      CollectionComponentContent,
    },
    props: {
      open: { type: Boolean, default: false },
    },
    emits: ['openList', 'update:modelValue'],
    setup(_props, { emit }) {
      const collectionComponent = inject(
        'collectionComponent',
      ) as CollectionComponentClass;

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
  });
</script>

<style lang="scss" scoped></style>
