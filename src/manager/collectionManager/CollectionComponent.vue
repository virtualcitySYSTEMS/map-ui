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
          <VcsActionButtonList v-if="actions?.length > 0" :actions="actions" />
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
  import { vcsAppSymbol } from '../../pluginHelper.js';
  import { WindowSlot } from '../window/windowManager.js';
  import CollectionComponentList, {
    moveItem,
  } from './CollectionComponentList.vue';

  /**
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
    setup() {
      /** @type {VcsUiApp} */
      const app = inject('vcsApp');
      /**
       * @type {CollectionComponent}
       */
      const collectionComponent = inject('collectionComponent');
      const windowId = `${collectionComponent.id}-list`;

      return {
        title: collectionComponent.title,
        items: collectionComponent.items,
        selection: collectionComponent.selection,
        draggable: collectionComponent.draggable,
        selectable: collectionComponent.selectable,
        singleSelect: collectionComponent.singleSelect,
        limit: collectionComponent.limit,
        actions: collectionComponent.getActions(),
        move({ item, targetIndex }) {
          moveItem(collectionComponent, item, targetIndex);
        },
        openCollectionComponentList() {
          if (app.windowManager.has(windowId)) {
            setTimeout(() => {
              app.windowManager.bringWindowToTop(windowId);
            }, 0);
          } else {
            app.windowManager.add(
              {
                id: windowId,
                component: CollectionComponentList,
                props: {
                  windowId,
                },
                provides: {
                  collectionComponent,
                },
                slot: WindowSlot.DYNAMIC_LEFT,
              },
              vcsAppSymbol,
            );
          }
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
