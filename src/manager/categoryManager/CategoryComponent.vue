<template>
  <v-expansion-panel @change="active = !active">
    <v-expansion-panel-header hide-actions class="px-2">
      <template #default="{ open }">
        <div class="d-flex justify-space-between">
          <div class="d-flex align-center">
            <v-icon class="mr-1" :class="{ rotate: !open }">
              mdi-chevron-down
            </v-icon>
            {{ $t(category.title) }}
          </div>
          <VcsActionButtonList
            v-if="category.actions?.length > 0"
            :actions="category.actions"
          />
        </div>
      </template>
    </v-expansion-panel-header>
    <v-expansion-panel-content class="pb-1">
      <vcs-list
        :items="category.items.slice(0, 10)"
        :draggable="category.draggable"
        :selectable="category.selectable"
        :single-select="category.singleSelect"
        v-model="selection"
        :show-title="false"
        @item-moved="move"
      />
      <v-sheet v-if="category.items.length > 10" class="ma-2 pl-2">
        <VcsButton @click="openCategoryItemWindow">
          {{ $t('categoryManager.more') }}
        </VcsButton>
      </v-sheet>
      <v-sheet v-else-if="category.items.length === 0" class="ma-2 pl-2">
        {{ $t('categoryManager.empty') }}
      </v-sheet>
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
  import { computed, inject, ref } from 'vue';
  import {
    VIcon,
    VExpansionPanel,
    VExpansionPanelHeader,
    VExpansionPanelContent,
    VSheet,
  } from 'vuetify/lib';
  import { IndexedCollection } from '@vcmap/core';
  import VcsList from '../../components/lists/VcsList.vue';
  import VcsActionButtonList from '../../components/buttons/VcsActionButtonList.vue';
  import VcsButton from '../../components/buttons/VcsButton.vue';
  import { vcsAppSymbol } from '../../pluginHelper.js';
  import CategoryComponentList from './CategoryComponentList.vue';
  import { WindowSlot } from '../window/windowManager.js';

  export default {
    name: 'CategoryComponent',
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
    props: {
      category: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      /** @type {VcsUiApp} */
      const app = inject('vcsApp');
      const windowId = `${props.category.id}-category-list`;
      const active = ref(false);

      const selection = computed({
        get() {
          return props.category.selection;
        },
        set(value) {
          // eslint-disable-next-line vue/no-mutating-props
          props.category.selection = value;
        },
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
        active,
        openCategoryItemWindow() {
          if (app.windowManager.has(windowId)) {
            setTimeout(() => {
              app.windowManager.bringWindowToTop(windowId);
            }, 0);
          } else {
            app.windowManager.add(
              {
                id: windowId,
                component: CategoryComponentList,
                props: {
                  category: props.category,
                  windowId,
                },
                provides: {
                  selection,
                },
                slot: WindowSlot.DYNAMIC_LEFT,
              },
              vcsAppSymbol,
            );
          }
        },
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
