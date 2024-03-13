<template>
  <v-expansion-panel>
    <v-expansion-panel-header hide-actions class="px-2">
      <template #default="{ open }">
        <div class="d-flex justify-space-between">
          <div class="d-flex align-center gap-1">
            <v-icon :class="{ rotate: !open }"> mdi-chevron-down </v-icon>
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
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content class="pb-1">
      <CollectionComponentContent @openList="(id) => $emit('openList', id)" />
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
  import { computed, inject } from 'vue';
  import {
    VIcon,
    VExpansionPanel,
    VExpansionPanelHeader,
    VExpansionPanelContent,
  } from 'vuetify/lib';
  import { createSelectionActions } from '../../components/lists/VcsList.vue';
  import VcsActionButtonList from '../../components/buttons/VcsActionButtonList.vue';
  import CollectionComponentContent from './CollectionComponentContent.vue';

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
      CollectionComponentContent,
      VcsActionButtonList,
      VExpansionPanel,
      VExpansionPanelHeader,
      VExpansionPanelContent,
      VIcon,
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

<style lang="scss" scoped>
  .rotate {
    transform: rotate(-90deg);
  }
  .v-icon {
    font-size: 16px;
  }
</style>
