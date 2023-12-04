<template>
  <v-expansion-panel>
    <v-expansion-panel-header hide-actions class="px-2">
      <template #default="{ open }">
        <div class="d-flex justify-space-between">
          <div class="d-flex align-center">
            <v-icon class="mr-1" :class="{ rotate: !open }">
              mdi-chevron-down
            </v-icon>
            {{ $t(title) }}
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
      <vcs-list
        :items="items.slice(0, limit)"
        :draggable="draggable"
        :selectable="selectable"
        :single-select="singleSelect"
        v-model="selection"
        :show-title="false"
        @item-moved="move"
        @item-renamed="rename"
      />
      <v-sheet v-if="items.length > limit" class="ma-2 pl-2">
        <VcsButton @click="openCollectionComponentList">
          {{ $t('collectionManager.more') }}
        </VcsButton>
      </v-sheet>
      <v-sheet v-else-if="items.length === 0" class="ma-2 pl-2">
        {{ $t('collectionManager.empty') }}
      </v-sheet>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
  import { inject } from 'vue';
  import {
    VIcon,
    VExpansionPanel,
    VExpansionPanelHeader,
    VExpansionPanelContent,
    VSheet,
  } from 'vuetify/lib';
  import VcsList from '../../components/lists/VcsList.vue';
  import VcsActionButtonList from '../../components/buttons/VcsActionButtonList.vue';
  import VcsButton from '../../components/buttons/VcsButton.vue';
  import { moveItem, renameItem } from './CollectionComponentList.vue';

  /**
   * @description
   * Renders the first ten items of a collectionComponent in a List. Uses CollectionComponentList to render more items.
   * The collectionComponent must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   */
  export default {
    name: 'CollectionComponent',
    components: {
      VcsActionButtonList,
      VcsButton,
      VcsList,
      VExpansionPanel,
      VExpansionPanelHeader,
      VExpansionPanelContent,
      VSheet,
      VIcon,
    },
    setup(_props, { emit }) {
      /**
       * @type {CollectionComponentClass}
       */
      const collectionComponent = inject('collectionComponent');

      return {
        title: collectionComponent.title,
        items: collectionComponent.items,
        selection: collectionComponent.selection,
        draggable: collectionComponent.draggable,
        selectable: collectionComponent.selectable,
        singleSelect: collectionComponent.singleSelect,
        overflowCount: collectionComponent.overflowCount,
        limit: collectionComponent.limit,
        actions: collectionComponent.getActions(),
        move({ item, targetIndex }) {
          moveItem(collectionComponent, item, targetIndex);
        },
        rename({ item, newTitle }) {
          renameItem(collectionComponent, item, newTitle);
        },
        openCollectionComponentList() {
          emit('openList', collectionComponent.id);
        },
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
  ::v-deep {
    .v-list {
      .v-list-item {
        padding: 4px 8px 4px 28px;
      }
    }
  }
</style>
