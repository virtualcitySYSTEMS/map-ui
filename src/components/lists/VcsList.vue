<template>
  <div class="d-contents vcs-list">
    <vcs-treeview-searchbar
      v-if="searchable"
      :placeholder="searchbarPlaceholder"
      v-model="query"
    />
    <v-list>
      <v-list-item v-if="showTitle && title">
        <template #prepend>
          <v-icon v-if="icon">
            {{ icon }}
          </v-icon>
        </template>
        <v-list-item-title class="font-weight-bold" ref="listHeader">
          <span :class="{ 'vcs-list-title__selected': selected.length > 0 }">
            {{ $st(title) }}
          </span>
          <v-tooltip v-if="listHeaderTooltip" activator="parent">
            {{ $st(listHeaderTooltip) }}
          </v-tooltip>
          <span v-if="selectable && selected.length > 0" class="ml-1">
            {{ `(${selected.length})` }}
          </span>
        </v-list-item-title>
        <template #append>
          <vcs-action-button-list
            v-if="renderingActions?.length > 0"
            :actions="renderingActions"
            :overflow-count="actionButtonListOverflowCount"
          />
        </template>
      </v-list-item>
      <template v-for="(item, index) in renderingItems">
        <VcsListItemComponent
          v-if="item"
          :dragging="dragging === index"
          :item="item"
          :key="`item-${index}`"
          :active="selected.includes(item)"
          @mousedown.shift="$event.preventDefault()"
          :draggable="isDraggable"
          @dragstart="dragStart($event, item, index)"
          @dragover.prevent="dragOver($event, index)"
          @dragend="dragEnd($event)"
          @drop="drop($event, index)"
          @dragleave="dragLeave($event, index)"
          :class="{
            'v-list-item__selected': selected.includes(item),
            'v-list-item__lighten_even': lightenEven,
            'v-list-item__lighten_odd': !lightenEven,
            'vcs-draggable-item': isDraggable,
            'v-list-item__dragged': dragging === index,
            'v-list-item__dragged_over': dragging !== undefined,
            'border-bottom': borderBottom(index),
            'border-top': borderTop(index),
            'cursor-pointer': selectable && !isDraggable,
          }"
          @click="select(item, $event)"
        >
          <template #append="scope">
            <slot name="item.append" v-bind="{ ...scope, index, item }" />
          </template>
          <template #title="scope">
            <slot name="item.title" v-bind="{ ...scope, index, item }" />
          </template>
          <template #subtitle="scope">
            <slot name="item.subtitle" v-bind="{ ...scope, index, item }" />
          </template>
          <template #prepend="scope">
            <slot name="item.prepend" v-bind="{ ...scope, index, item }" />
          </template>
        </VcsListItemComponent>
        <slot name="item.intermediate" :item="item" :index="index" />
        <div
          v-if="hasIntermediateSlot"
          :key="`item-intermediate-child-balance-${index}`"
        />
      </template>
    </v-list>
  </div>
</template>

<script setup>
  import { computed, getCurrentInstance, ref, useSlots, watch } from 'vue';
  import {
    VIcon,
    VList,
    VListItem,
    VListItemTitle,
    VTooltip,
  } from 'vuetify/components';
  import { setupDraggableList, setupSelectableList } from './listHelper.js';
  import VcsListItemComponent from './VcsListItemComponent.vue';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.vue';
  import { createEllipseTooltip } from '../composables.js';

  /**
   * @typedef {Object} ItemMovedEvent
   * @property {import("./VcsListItemComponent.vue").VcsListItem} item
   * @property {number} targetIndex
   */

  /**
   * @description
   * The VcsList is intended to render items. Items can be selectable (by default, more than one) or only a single item can
   * be selected. If items are disabled they cannot be selected. Items which are not visible are not rendered. These items can
   * no longer be selected or deselected either. Making a selected item invisible can lead to undefined behavior
   * in the selection state.
   * Clicking an unselected item selects it.
   * Clicking a selected item which is not part of a set or range, deselects it.
   * Clicking a selected item of a list or range will deselect the other items in the range or set
   * Clicking with CTRL adds or removes to a selection set.
   * Clicking with SHIFT will create a selection range, starting or ending with the first item in the list
   * or the last normally selected item (not the last item clicked with CTRL for instance).
   * @vue-prop {Array<import("./VcsListItemComponent.vue").VcsListItem>} items
   * @vue-prop {boolean} [draggable=false]
   * @vue-prop {boolean} [selectable=false]
   * @vue-prop {boolean} [singleSelect=false]
   * @vue-prop {Array<import("./VcsListItemComponent.vue").VcsListItem>} [modelValue=[]] - the initial items to be selected.
   * @vue-prop {boolean} [searchable=false] - if this list can have its items searched.
   * @vue-prop {function(import("./VcsListItemComponent.vue").VcsListItem, string):boolean} [customFilter] - a function to customize filtering when searching.
   * @vue-prop {string} [searchbarPlaceholder] - placeholder to render inside the search field
   * @vue-prop {boolean} [showTitle=true] - show the title component
   * @vue-prop {number} [actionButtonListOverflowCount] - overflow count to use for action lists in the title and items
   * @vue-prop {string} [title] - the lists title
   * @vue-prop {string} [icon] - icon to prepend to the list title
   * @vue-prop {string} [tooltip] - tooltip to render on the list title
   * @vue-prop {Array<import("../../actions/actionHelper.js").VcsAction>} [actions] - actions to render in the list title
   * @vue-event {ItemMovedEvent} itemMoved - event triggered after item was dragged and is dropped
   * @vue-data {slot} [#item.prepend] - A slot that forwads to v-list-item prepend slot. Binds v-list-item append slot props, item and item index.
   * @vue-data {slot} [#item.title] - A slot that forwards to v-list-item title slot. Binds v-list-item title slot props, item and item index.
   * @vue-data {slot} [#item.subtitle] - A slot that forwards to v-list-item subtitle slot. Binds v-list-item subtitle slot props, item and item index.
   * @vue-data {slot} [#item.append] - A slot that forwards to v-list-item append slot. Binds v-list-item append slot props, item and item index.
   * @vue-data {slot} [#item.intermediate] - A slot to introduce content, e.g. buttons between two list items. Binds item and item index.
   */

  const props = defineProps({
    items: {
      type: Array,
      required: true,
    },
    draggable: {
      type: Boolean,
      default: false,
    },
    selectable: {
      type: Boolean,
      default: false,
    },
    singleSelect: {
      type: Boolean,
      default: false,
    },
    selectFunction: {
      type: Function,
      default: undefined,
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
    searchable: {
      type: Boolean,
      default: false,
    },
    customFilter: {
      type: Function,
      default: undefined,
    },
    searchbarPlaceholder: {
      type: String,
      default: undefined,
    },
    showTitle: {
      type: Boolean,
      default: true,
    },
    actionButtonListOverflowCount: {
      type: Number,
      required: false,
      default: undefined,
    },
    title: {
      type: String,
      required: false,
      default: '',
    },
    icon: {
      type: String,
      required: false,
      default: undefined,
    },
    tooltip: {
      type: String,
      required: false,
      default: '',
    },
    actions: {
      type: Array,
      required: false,
      default: () => [],
    },
  });

  const emit = defineEmits(['update:modelValue', 'itemMoved']);

  const slots = useSlots();

  const lightenEven = computed(() => {
    return !(!props.searchable && !props.showTitle);
  });

  /** @type {import("vue").Ref<string>} */
  const query = ref('');

  watch(
    () => props.searchable,
    (searchable) => {
      if (!searchable) {
        query.value = '';
      }
    },
    { immediate: true },
  );

  const vm = getCurrentInstance().proxy;
  /** @type {function(import("./VcsListItemComponent.vue").VcsListItem, string):boolean} */
  const filterPredicate = (item, queryString = '') => {
    if (props.customFilter) {
      return props.customFilter(item, queryString);
    }
    const translatedTitle = vm.$st(item.title);
    return translatedTitle
      .toLocaleLowerCase()
      .includes(queryString.toLocaleLowerCase());
  };

  /**
   * @type {import("vue").ComputedRef<Array<import("./VcsListItemComponent.vue").VcsListItem>>}
   */
  const renderingItems = computed(() => {
    let items = props.items.filter((i) => i.visible !== false);
    if (query.value) {
      items = items.filter((i) => filterPredicate(i, query.value));
    }
    return items;
  });

  const {
    dragging,
    isDraggable,
    borderBottom,
    borderTop,
    dragStart,
    dragOver,
    dragLeave,
    dragEnd,
    drop,
  } = setupDraggableList(props, query, emit);

  const { select, selected, selectionActions } = setupSelectableList(
    props,
    renderingItems,
    emit,
  );

  /**
   * @type {import("vue").ComputedRef<Array<import("../../actions/actionHelper.js").VcsAction>>}
   */
  const renderingActions = computed(() => {
    if (props.selectable && !props.singleSelect) {
      return [...selectionActions, ...props.actions];
    }
    return props.actions;
  });

  const listHeader = ref();
  const listHeaderTooltip = createEllipseTooltip(
    computed(() => listHeader.value?.$el),
    computed(() => props.tooltip),
    computed(() => props.title),
  );
  const hasIntermediateSlot = computed(() => !!slots['item.intermediate']);
</script>

<style lang="scss" scoped>
  :deep(.v-list) {
    .v-list-item__lighten_even:nth-child(even) {
      background-color: rgb(var(--v-theme-base-lighten-4));
    }
    .v-list-item__lighten_odd:nth-child(odd) {
      background-color: rgb(var(--v-theme-base-lighten-4));
    }
    .v-list-item__dragged {
      background-color: rgb(var(--v-theme-base-lighten-2)) !important;
    }
    .v-list-item__dragged_over:hover {
      background-color: rgb(var(--v-theme-base-lighten-1)) !important;
    }
    .v-list-item__selected {
      border-left: solid 4px;
      border-left-color: rgb(var(--v-theme-primary));
      color: rgb(var(--v-theme-primary));
      padding-left: 12px !important;
    }
    .v-list-item--active {
      .v-list-item__append {
        color: rgb(var(--v-theme-on-surface));
      }
    }
    .v-list-item {
      &.vcs-draggable-item:hover {
        cursor: grab;
        user-select: none;
      }
      &:hover {
        .v-list-item__overlay {
          background-color: rgb(var(--v-theme-on-surface));
        }
      }
      .vcs-list-title__selected {
        width: 90%;
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: bottom;
      }
    }

    &:not(.vcs-list__selectable) {
      cursor: auto;

      .v-list-item--link {
        cursor: auto;
      }

      &:hover {
        .v-list-item__overlay {
          background-color: rgb(var(--v-theme-on-surface));
        }
      }
    }
  }
  .d-contents {
    display: contents;
  }
</style>
