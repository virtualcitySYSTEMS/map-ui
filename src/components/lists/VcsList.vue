<template>
  <div class="d-contents vcs-list">
    <vcs-treeview-searchbar
      v-if="searchable"
      :placeholder="searchbarPlaceholder"
      v-model="query"
    />
    <v-list :class="{ 'vcs-list__selectable': selectable }">
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
          @mouseover="hovering = index"
          @mouseout="hovering = undefined"
          :draggable="isDraggable"
          @dragstart="drag($event, item, index)"
          @mouseup="drop($event, index)"
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

<script>
  import {
    computed,
    getCurrentInstance,
    inject,
    isReactive,
    reactive,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import {
    VList,
    VListItem,
    VIcon,
    VListItemTitle,
    VTooltip,
  } from 'vuetify/components';
  import VcsListItemComponent from './VcsListItemComponent.vue';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.vue';
  import { createEllipseTooltip } from '../composables.js';

  /**
   * @param {import("vue").Ref<import("./VcsListItemComponent.vue").VcsListItem[]>} items
   * @param {import("vue").ShallowRef<import("./VcsListItemComponent.vue").VcsListItem[]>} selected
   * @param {function(string, ...any[]):void} emit
   * @returns {Array<import("../../actions/actionHelper.js").VcsAction>}
   */
  export function createSelectionActions(items, selected, emit) {
    const selectAllAction = reactive({
      name: 'list.selectAll',
      tooltip: 'list.selectAll',
      disabled: items.value.length - selected.value.length < 1,
      callback() {
        const currentSelection = [...selected.value];
        selected.value = items.value.filter((item) => !item.disabled);

        selected.value.forEach((item) => {
          if (item.selectionChanged && !currentSelection.includes(item)) {
            item.selectionChanged(true);
          }
        });
        emit('update:modelValue', selected.value);
      },
    });
    const clearSelectionAction = reactive({
      name: 'list.clearSelection',
      tooltip: 'list.clearSelection',
      disabled: selected.value.length < 1,
      callback() {
        [...selected.value].forEach((item) => {
          if (item.selectionChanged) {
            item.selectionChanged(false);
          }
        });
        selected.value = [];
        emit('update:modelValue', selected.value);
      },
    });

    watch(
      [items, selected],
      () => {
        selectAllAction.disabled =
          items.value.length - selected.value.length < 1;
        clearSelectionAction.disabled = selected.value.length < 1;
      },
      { deep: false, immediate: true },
    );

    return [selectAllAction, clearSelectionAction];
  }

  /**
   * @typedef {Object} ItemMovedEvent
   * @property {import("./VcsListItemComponent.vue").VcsListItem} item
   * @property {number} targetIndex
   */

  /**
   * @description
   * The VCS list is intended to render items. Items can be selectable (by default, more than one) or only a single item can
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
   * @vue-prop {Array<import("./VcsListItemComponent.vue").VcsListItem>} [value=[]] - the initial items to be selected.
   * @vue-prop {boolean} [searchable=false] - if this list can have its items searched. you can provide your own predicate function by providing "filterPredicate" which is of type function(import("./VcsListItemComponent.vue").VcsListItem, string):boolean
   * @vue-prop {string} [searchbarPlaceholder] - placeholder to render inside the search field
   * @vue-prop {boolean} [showTitle=true] - show the title component
   * @vue-prop {number} [actionButtonListOverflowCount] - overflow count to use for action lists in the title and items
   * @vue-prop {string} [title] - the lists title
   * @vue-prop {string} [icon] - icon to prepend to the list title
   * @vue-prop {string} [tooltip] - tooltip to render on the list title
   * @vue-prop {Array<import("../../actions/actionHelper.js").VcsAction>} [actions] - actions to render in the list title
   * @vue-event {ItemMovedEvent} item-moved - event triggered after item was dragged and is dropped
   * @vue-data {slot} [#item.prepend] - A slot that forwads to v-list-item prepend slot. Binds v-list-item append slot props, item and item index.
   * @vue-data {slot} [#item.title] - A slot that forwards to v-list-item title slot. Binds v-list-item title slot props, item and item index.
   * @vue-data {slot} [#item.subtitle] - A slot that forwards to v-list-item subtitle slot. Binds v-list-item subtitle slot props, item and item index.
   * @vue-data {slot} [#item.append] - A slot that forwards to v-list-item append slot. Binds v-list-item append slot props, item and item index.
   * @vue-data {slot} [#item.intermediate] - A slot to introduce content, e.g. buttons between two list items. Binds item and item index.
   */
  export default {
    name: 'VcsList',
    components: {
      VcsListItemComponent,
      VcsTreeviewSearchbar,
      VcsActionButtonList,
      VTooltip,
      VList,
      VListItem,
      VIcon,
      VListItemTitle,
    },
    props: {
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
      modelValue: {
        type: Array,
        default: () => [],
      },
      searchable: {
        type: Boolean,
        default: false,
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
    },
    setup(props, { emit, slots }) {
      /** @type {import("vue").ShallowRef<Array<import("./VcsListItemComponent.vue").VcsListItem>>} */
      const selected = shallowRef([]);
      /** @type {import("vue").Ref<string>} */
      const query = ref('');
      /** @type {import("vue").Ref<number|undefined>} */
      const hovering = ref(undefined);
      /** @type {import("vue").Ref<number|undefined>} */
      const dragging = ref(undefined);
      const borderBottom = (index) => {
        return (
          dragging.value !== undefined &&
          dragging.value < index &&
          index === hovering.value
        );
      };
      const borderTop = (index) => {
        return (
          dragging.value !== undefined &&
          dragging.value > index &&
          index === hovering.value
        );
      };
      const lightenEven = computed(() => {
        return !(!props.searchable && !props.showTitle);
      });
      let firstSelected = null;
      const listHeader = ref();

      watch(
        props,
        () => {
          if (selected.value !== props.modelValue) {
            selected.value = props.modelValue;
          }
          if (props.singleSelect && selected.value.length > 1) {
            selected.value
              .filter((i, index) => index && i.selectionChanged)
              .forEach((i) => i.selectionChanged(false));
            selected.value = [selected.value[0]];
            emit('update:modelValue', selected);
          }
          if (!props.selectable && selected.value.length > 0) {
            selected.value
              .filter((i) => i.selectionChanged)
              .forEach((i) => i.selectionChanged(false));
            selected.value = [];
            emit('update:modelValue', selected);
          }
          if (!props.searchable) {
            query.value = '';
          }
        },
        { immediate: true, deep: false },
      );

      const vm = getCurrentInstance().proxy;
      /** @type {function(import("./VcsListItemComponent.vue").VcsListItem, string):boolean} */
      const filterPredicate = inject(
        'filterPredicate',
        (item, queryString = '') => {
          const translatedTitle = vm.$st(item.title);
          return translatedTitle
            .toLocaleLowerCase()
            .includes(queryString.toLocaleLowerCase());
        },
      );

      /**
       * @type {import("./VcsListItemComponent.vue").VcsListItem|null}
       */
      let draggedItem = null;

      const isDraggable = computed(() => {
        return !query.value && props.draggable;
      });

      /**
       * @param {MouseEvent} e
       * @param {number} targetIndex
       */
      function drop(e, targetIndex) {
        if (isDraggable.value) {
          if (draggedItem !== null && targetIndex !== undefined) {
            emit('item-moved', { item: draggedItem, targetIndex });
          }
          draggedItem = null;
          dragging.value = undefined;
          document.removeEventListener('mouseup', drop);
        }
      }

      /**
       * @param {MouseEvent} e
       * @param {import("./VcsListItemComponent.vue").VcsListItem} item
       * @param {number} index
       */
      function drag(e, item, index) {
        if (isDraggable.value) {
          dragging.value = index;
          draggedItem = item;
          e.dataTransfer.effectAllowed = 'move';
          document.addEventListener('mouseup', drop);
        }
      }

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

      const selectionActions = createSelectionActions(
        renderingItems,
        selected,
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

      return {
        query,
        hovering,
        dragging,
        isDraggable,
        borderBottom,
        borderTop,
        lightenEven,
        /**
         * @type {import("vue").ComputedRef<Array<import("../../actions/actionHelper.js").VcsAction>>}
         */
        renderingActions,
        /**
         * @type {import("vue").ComputedRef<Array<import("./VcsListItemComponent.vue").VcsListItem>>}
         */
        renderingItems,
        /** @type {import("vue").ShallowRef<Array<import("./VcsListItemComponent.vue").VcsListItem>>} */
        selected,
        /**
         * @param {import("vue").UnwrapNestedRef<import("./VcsListItemComponent.vue").VcsListItem>} item
         * @param {PointerEvent} event
         */
        select(item, event) {
          if (!isReactive(item)) {
            throw new Error('Trying to select an unreactive item');
          }
          if (Array.isArray(item.clickedCallbacks)) {
            item.clickedCallbacks.forEach((cb) => cb(event));
          }
          if (!props.selectable || item.disabled) {
            return;
          }
          if (props.singleSelect) {
            if (selected.value[0] === item) {
              item.selectionChanged?.(false);
              selected.value = [];
              firstSelected = null;
            } else {
              selected.value[0]?.selectionChanged?.(false);
              item.selectionChanged?.(true);
              selected.value = [item];
              firstSelected = item;
            }
          } else if (event.shiftKey) {
            let firstIndex = 0;
            if (firstSelected) {
              firstIndex = renderingItems.value.indexOf(firstSelected);
            }
            const currentIndex = renderingItems.value.indexOf(item);
            if (firstIndex > -1 && currentIndex > -1) {
              const currentSelection = [...selected.value];
              selected.value = renderingItems.value.slice(
                Math.min(firstIndex, currentIndex),
                Math.max(firstIndex, currentIndex) + 1,
              );
              currentSelection.forEach((oldItem) => {
                if (
                  oldItem.selectionChanged &&
                  !selected.value.includes(oldItem)
                ) {
                  oldItem.selectionChanged(false);
                }
              });
              selected.value.forEach((newItem) => {
                if (
                  newItem.selectionChanged &&
                  !currentSelection.includes(newItem)
                ) {
                  newItem.selectionChanged(true);
                }
              });
            } else {
              selected.value
                .filter((i) => i !== item && i.selectionChanged)
                .forEach((i) => i.selectionChanged(false));
              selected.value = [];
              firstSelected = null;
            }
          } else if (selected.value.includes(item)) {
            if (event.ctrlKey) {
              item.selectionChanged?.(false);
              selected.value = selected.value.filter((i) => i !== item);
            } else if (selected.value.length > 1) {
              selected.value
                .filter((i) => i !== item && i.selectionChanged)
                .forEach((i) => {
                  i.selectionChanged(false);
                });
              selected.value = [item];
              firstSelected = item;
            } else {
              item.selectionChanged?.(false);
              selected.value = [];
              firstSelected = null;
            }
          } else if (event.ctrlKey) {
            item.selectionChanged?.(true);
            selected.value = [...selected.value, item];
            if (selected.value.length === 1) {
              firstSelected = item;
            }
          } else {
            selected.value
              .filter((i) => i !== item && i.selectionChanged)
              .forEach((i) => i.selectionChanged(false));
            item.selectionChanged?.(true);
            selected.value = [item];
            firstSelected = item;
          }

          emit('update:modelValue', selected.value);
        },
        /**
         * @param {import("vue").UnwrapNestedRefs<import("./VcsListItemComponent.vue").VcsListItem>} item
         */
        add(item) {
          if (!isReactive(item)) {
            throw new Error('Trying to select an unreactive item');
          }
          if (!selected.value.includes(item) && !item.disabled) {
            item.selectionChanged?.(true);
            selected.value = [...selected.value, item];
            emit('update:modelValue', selected.value);
          }
        },
        /**
         * @param {import("vue").UnwrapNestedRefs<import("./VcsListItemComponent.vue").VcsListItem>} item
         */
        remove(item) {
          if (selected.value.includes(item) && !item.disabled) {
            item.selectionChanged?.(false);
            selected.value = selected.value.filter((i) => i !== item);
            emit('update:modelValue', selected.value);
          }
        },
        clear() {
          selected.value
            .filter((i) => i.selectionChanged)
            .forEach((i) => i.selectionChanged(false));
          selected.value = [];
          firstSelected = null;
          emit('update:modelValue', selected.value);
        },
        drag,
        drop,
        listHeader,
        listHeaderTooltip: createEllipseTooltip(
          computed(() => listHeader.value?.$el),
          computed(() => props.tooltip),
          computed(() => props.title),
        ),
        hasIntermediateSlot: computed(() => !!slots['item.intermediate']),
      };
    },
  };
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
          background-color: rgb(var(--v-theme-base));
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
          background-color: transparent;
        }
      }
    }
  }
  .d-contents {
    display: contents;
  }
</style>
