<template>
  <div class="vcs-treeview">
    <VcsTreeviewSearchbar
      v-if="showSearchbar"
      :placeholder="searchbarPlaceholder"
      v-model="localSearchValue"
    />
    <div
      v-for="item in items"
      :key="item.name"
      class="vcs-treeitem"
      :class="{ 'mobile-spacing': xs }"
    >
      <VcsTreeNode
        class="root-node"
        :item="item"
        :search="localSearchValue"
        v-model:opened="localOpenedItems"
        :custom-filter="customFilter"
        :open-on-click="openOnClick"
        :item-children="itemChildren"
        @item-toggled="itemToggled"
        @click="itemClicked"
      >
        <template v-for="slot of forwardSlots" #[slot]="scope">
          <slot :name="slot" v-bind="scope ?? {}" />
        </template>
      </VcsTreeNode>
    </div>
  </div>
</template>

<script>
  import { watch } from 'vue';
  import { useDisplay } from 'vuetify';
  import { getLogger } from '@vcsuite/logger';
  import {
    useProxiedAtomicModel,
    useProxiedComplexModel,
  } from '../modelHelper.js';
  import { getForwardSlots } from '../composables.js';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.vue';
  import VcsTreeNode from './VcsTreeNode.vue';

  /**
   * @description The VcsTreeview is heavily inspired by the Vuetify VTreeview component. Can render dynamic components as leaf items.
   * Exposes the `search` value for filtering the treeview.
   * Exposes the `opened` model-value for controlling the opened state of the treeview.
   * Forwards the `prepend`, `title` and `append` slots to the VcsTreeNode component.
   * @vue-prop {Array<import("./VcsTreeNode.vue").VcsTreeNodeItem>} items.
   * @vue-prop {Array<import("./VcsTreeNode.vue").VcsTreeNodeItem>} opened - Array of name of opened nodes.
   * @vue-prop {string} [itemChildren='children'] - The property key of the children.
   * @vue-prop {boolean} [openAll=false] - Whether to open all root items on startup.
   * @vue-prop {boolean} [openOnClick=false] - Whether to open items on title click.
   * @vue-prop {string} [search=''] - The value used to filter the items.
   * @vue-prop {boolean} [showSearchbar=false] - Whether there is a searchbar for this treeview.
   * @vue-prop {function(import("./VcsTreeNode.vue").VcsTreeNodeItem, string|undefined):boolean}} [customFilter] - a function to customize filtering when searching.
   * @vue-prop {string}  [searchbarPlaceholder] - Placeholder text for the searchbar, will be translated.
   */
  export default {
    name: 'VcsTreeview',
    components: {
      VcsTreeviewSearchbar,
      VcsTreeNode,
    },
    props: {
      items: {
        type: Array,
        default: () => [],
      },
      opened: {
        type: Array,
        default: () => [],
      },
      itemChildren: {
        type: String,
        default: 'children',
      },
      openAll: {
        type: Boolean,
        default: false,
      },
      openOnClick: {
        type: Boolean,
        default: false,
      },
      search: {
        type: String,
        default: '',
      },
      showSearchbar: {
        type: Boolean,
        default: false,
      },
      searchbarPlaceholder: {
        type: String,
        default: undefined,
      },
      /**
       * @param {import("./VcsTreeNode.vue").VcsTreeNodeItem} item The item to filter.
       * @param {string} search The query value.
       */
      customFilter: {
        type: Function,
        default: undefined,
      },
    },
    emits: ['update:search', 'update:opened'],
    setup(props, { emit, slots }) {
      const forwardSlots = getForwardSlots(slots);
      const localSearchValue = useProxiedAtomicModel(props, 'search', emit);
      const localOpenedItems = useProxiedComplexModel(props, 'opened', emit);

      watch(
        [() => props.items, () => props.openAll],
        () => {
          if (props.openAll) {
            const newItems = props.items
              .map((item) => item.name)
              .filter((name) => !localOpenedItems.value.includes(name));
            localOpenedItems.value.push(...newItems);
          }
        },
        {
          immediate: true,
        },
      );

      function itemToggled(itemName) {
        const idx = localOpenedItems.value.indexOf(itemName);
        if (idx >= 0) {
          localOpenedItems.value.splice(idx, 1);
        } else {
          localOpenedItems.value.push(itemName);
        }
      }

      const { xs } = useDisplay();

      return {
        localSearchValue,
        localOpenedItems,
        forwardSlots,
        itemToggled,
        itemClicked(item, event) {
          if (item?.clickable) {
            if (item?.clicked && !item?.disabled) {
              const p = item.clicked(event);
              if (p instanceof Promise) {
                p.catch((e) => {
                  getLogger('VcsTreeview.vue').error(
                    `Tree view item failed to click ${item.name}`,
                    e,
                  );
                });
              }
            }
          } else if (
            (props.openOnClick ?? false) !== false &&
            !item?.disabled
          ) {
            itemToggled(item.name);
          }
        },
        xs,
      };
    },
  };
</script>

<style lang="scss" scoped>
  // Hide node component when not rendered (e.g. filtered by search)
  .vcs-treeitem:not(:has(.vcs-tree-node)) {
    display: none;
  }
  .vcs-treeitem:not(:last-child) {
    border-bottom: 1px solid rgb(var(--v-theme-base-lighten-2));
  }
  :deep(
    .mobile-spacing
      > .vcs-tree-node
      > .children
      > .vcs-tree-node
      > .treenode
      > .vcs-action-button-list
      > button:not(:last-child)
  ) {
    margin-left: 10px !important;
    margin-right: 10px !important;
  }
  :deep(
    .mobile-spacing
      > .vcs-tree-node
      > .treenode
      > .vcs-action-button-list
      > button:not(:last-child)
  ) {
    margin-left: 10px !important;
    margin-right: 10px !important;
  }
  .root-node {
    :deep(.level-0) {
      // Root Level Entries should be 40px high
      min-height: calc(var(--v-vcs-font-size) * 2 + 14px) !important;
    }
    // Only Group Entries have a bold font
    > :deep(.group) {
      font-weight: 700 !important;
    }
  }
</style>
