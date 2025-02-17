<template>
  <div class="vcs-tree-node" v-if="matchFilter">
    <v-row
      no-gutters
      class="treenode flex-nowrap text-truncate"
      :class="`level-${level} ${children.length ? 'group' : 'item'}`"
    >
      <VBtn
        v-if="children.length"
        class="chevron-btn"
        variant="text"
        :icon="isOpen ? 'mdi-chevron-down' : 'mdi-chevron-right'"
        @click="bubbleItemToggled(item.name)"
      />
      <slot name="prepend" v-bind="{ item }">
        <span
          class="prepend"
          :class="{
            'text-disabled': item.disabled,
          }"
        >
          <div v-if="item.icon">
            <v-icon v-if="typeof item?.icon === 'string'" :size="iconSize">
              {{ item.icon }}
            </v-icon>
            <ImageElementInjector :element="item.icon" v-else />
          </div>
        </span>
      </slot>
      <slot name="title" v-bind="{ item }">
        <VcsTreeviewTitle
          :item="item"
          :cursor-pointer="item.clickable || (openOnClick && !!children.length)"
          @click="(event) => $emit('click', item, event)"
        />
      </slot>
      <slot name="append" v-bind="{ item }">
        <VcsActionButtonList
          v-if="item.actions?.length > 0"
          :actions="item.actions"
          :overflow-count="3"
          :disabled="item.disabled"
          right
          tooltip-position="right"
          block-overflow
          class="col-4 pa-0 ml-auto pr-4"
        />
      </slot>
    </v-row>
    <v-expand-transition>
      <div v-if="isOpen && children.length" class="children">
        <VcsTreeNode
          v-for="child in children"
          :key="child.name"
          :item="child"
          :search="search"
          :custom-filter="customFilter"
          :level="level + 1"
          :open-on-click="openOnClick"
          :item-children="itemChildren"
          :opened="opened"
          @item-toggled="bubbleItemToggled"
          @click="bubbleItemClicked"
        >
          <template v-for="slot of forwardSlots" #[slot]="scope">
            <slot :name="slot" v-bind="scope ?? {}" />
          </template>
        </VcsTreeNode>
      </div>
    </v-expand-transition>
  </div>
</template>

<script>
  import { computed, getCurrentInstance } from 'vue';
  import { VBtn, VExpandTransition, VIcon, VRow } from 'vuetify/components';
  import { useIconSize } from '../../vuePlugins/vuetify.js';
  import { getForwardSlots } from '../composables.js';
  import ImageElementInjector from '../ImageElementInjector.vue';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import VcsTreeviewTitle from './VcsTreeviewTitle.vue';

  /**
   * @typedef {Object} VcsTreeNodeItem
   * @property {string} name
   * @property {string} [title] - An optional translatable title.
   * @property {string} [tooltip]
   * @property {boolean} [clickable] - Whether this item reacts to click events.
   * @property {boolean} [disabled] - Whether this item should be displayed as disabled.
   * @property {Array<import("../../actions/actionHelper.js").VcsAction>} [actions]
   * @property {Array<VcsTreeNodeItem>} [children] - An optional array of children. Can be binded to another key, using the `item-children` attributes of the VcsTreeview component.
   * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} [icon] - An optional icon to display with this item. Can be a URL or HTMLElement.
   * @property {function(string):void} [clicked] - A callback called when the item is clicked.
   */

  /**
   * @description
   *  A recursive component to render a treenode and its children.
   * Exposes the `prepend`, `title` and `append` slots for customization.
   * Emits `itemToggled` and `click` events.
   * @vue-prop {VcsTreeNodeItem} item - The item to render.
   * @vue-prop {Array<string>} opened - Names of the opened items.
   * @vue-prop {number} [level=0] - The level of the item
   * @vue-prop {string} [itemChildren='children'] - The property key of the children.
   * @vue-prop {boolean} [openOnClick=false] - Whether to open items on title click..
   * @vue-prop {string} [search] - The search string to filter the tree.
   * @vue-prop {function(VcsTreeNodeItem, string|undefined):boolean}} [customFilter] - a function to customize filtering when searching.
   * @vue-data {slot} [#prepend] - A slot prepended to the item, binding the item. Default fallback renders an image.
   * @vue-data {slot} [#title] - A slot to render the item title, binding the item. Default fallback renders a translatable title using the VcsTreeviewTitle component.
   * @vue-data {slot} [#append] - A slot appended to the item, binding the item. Default fallback renders the VcsActionButtonList if the item has an array of Actions.
   */
  export default {
    name: 'VcsTreeNode',
    components: {
      ImageElementInjector,
      VBtn,
      VExpandTransition,
      VIcon,
      VRow,
      VcsActionButtonList,
      VcsTreeviewTitle,
    },
    props: {
      /** @type {VcsTreeNodeItem} */
      item: {
        type: Object,
        required: true,
      },
      opened: {
        type: Array,
        required: true,
      },
      level: {
        type: Number,
        default: 0,
      },
      openOnClick: {
        type: Boolean,
        default: false,
      },
      itemChildren: {
        type: String,
        default: 'children',
      },
      search: {
        type: String,
        default: undefined,
      },
      /**
       * @param {VcsTreeNodeItem} item The item to check the match for.
       * @param {string} search The search value.
       */
      customFilter: {
        type: Function,
        default: undefined,
      },
    },
    emits: ['itemToggled', 'click'],
    setup(props, { emit, slots }) {
      const vm = getCurrentInstance().proxy;
      const iconSize = useIconSize();
      const forwardSlots = getForwardSlots(slots);

      const isOpen = computed(() => props.opened.includes(props.item.name));
      const children = computed(() => props.item[props.itemChildren] ?? []);

      const matchFilter = computed(() => {
        if (!props.search) {
          return true;
        }
        if (props.customFilter) {
          return props.customFilter(props.item, props.search);
        }
        const translatedTitle = (item) =>
          item.title ? vm.$t(item.title) : item.name;

        const hasText = (item) =>
          translatedTitle(item)
            .toLocaleLowerCase()
            .indexOf(props.search.toLocaleLowerCase()) > -1 ||
          item[props.itemChildren]?.some(hasText);

        return hasText(props.item);
      });

      return {
        forwardSlots,
        isOpen,
        matchFilter,
        iconSize,
        children,

        // Bubble up events for the nested tree-items
        bubbleItemToggled: (itemName) => {
          emit('itemToggled', itemName);
        },
        bubbleItemClicked: (item, event) => {
          emit('click', item, event);
        },
      };
    },
  };
</script>

<style lang="scss" scoped>
  .treenode {
    align-items: center !important;
    min-height: calc(var(--v-vcs-font-size) * 2 + 6px);
  }
  @for $i from 0 through 6 {
    .level-#{$i} {
      padding-left: calc(var(--v-vcs-font-size) * $i + 2px);
      &.item {
        & > .prepend:not(:has(.v-icon)) {
          margin-left: calc(var(--v-vcs-font-size) * 2);
        }
        & > .prepend:has(.v-icon) {
          margin-left: 4px;
        }
      }
    }
  }
  .prepend {
    :deep(.v-icon) {
      margin-right: 6px;
      display: flex;
      align-items: start;
    }
  }
  // Indent children padding
  .children {
    padding-left: var(--v-vcs-font-size);
  }
  // set the size of the buttons, except for the ActionButtonList
  :deep(.v-btn):not(.vcs-button) {
    width: var(--v-vcs-font-size);
    height: var(--v-vcs-font-size);
    // for alignment of chevron
    display: flex;
    &.chevron-btn {
      margin-left: 4px;
      margin-right: 8px;
    }
  }
  // remove hover shadow over button
  :deep(.v-btn__overlay) {
    --v-hover-opacity: 0;
  }
</style>
