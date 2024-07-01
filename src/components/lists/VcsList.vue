<template>
  <div class="d-contents">
    <vcs-treeview-searchbar
      v-if="searchable"
      :placeholder="searchbarPlaceholder"
      v-model="query"
    />
    <v-list density="compact">
      <v-list-item v-if="showTitle" class="font-weight-bold">
        <template #prepend>
          <v-icon v-if="icon">
            {{ icon }}
          </v-icon>
        </template>
        <v-list-item-title>
          <VcsTooltip :tooltip="$st(listHeaderTooltip)">
            <template #activator="{ props }">
              <span v-bind="props" ref="listHeader">
                {{ $st(title) }}
              </span>
            </template>
          </VcsTooltip>
          <span v-if="selectable && selected.length > 0">
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
      <div v-for="(item, index) in renderingItems" :key="`item-${index}`">
        <v-list-item
          :active="selected.includes(item)"
          :disabled="item.disabled"
          @mousedown.shift="$event.preventDefault()"
          @mouseover="hovering = index"
          @mouseout="hovering = undefined"
          :draggable="isDraggable"
          @dragstart="drag($event, item, index)"
          @mouseup="drop($event, index)"
          color="primary"
          :class="{
            'v-list-item__selected': selected.includes(item),
            'v-list-item__lighten_even': lightenEven,
            'v-list-item__lighten_odd': !lightenEven,
            'vcs-draggable-item': isDraggable,
            'v-list-item__dragged': dragging === index,
            'border-bottom': borderBottom(index),
            'border-top': borderTop(index),
            'cursor-pointer': selectable && !isDraggable,
          }"
          @click="select(item, $event)"
        >
          <template #prepend>
            <v-icon v-if="item.icon">
              {{ item.icon }}
            </v-icon>
          </template>
          <VcsTooltip
            :tooltip="
              dragging !== undefined
                ? undefined
                : $st(item.tooltip || overflowTitle(index, item.title))
            "
          >
            <template #activator="{ props }">
              <v-list-item-title
                v-bind="props"
                ref="titles"
                class="d-flex gc-2"
              >
                <slot name="item.prepend-title" :item="item" :index="index" />
                <slot name="item.title" :item="item" :index="index">
                  <VcsTextField
                    v-if="item.rename"
                    :model-value="item.title"
                    autofocus
                    :no-padding="true"
                    @update:model-value="(value) => rename(item, value)"
                    @click.stop
                    @keydown.enter="item.rename = false"
                    @blur="item.rename = false"
                    :rules="[(v) => !!v || 'components.validation.required']"
                  />
                  <span v-else>
                    {{ $st(item.title) }}
                  </span>
                </slot>
                <slot
                  name="item.append-title"
                  :item="item"
                  :index="index"
                  class="ml-auto"
                />
              </v-list-item-title>
            </template>
          </VcsTooltip>
          <template #append>
            <VcsBadge v-if="item.hasUpdate" :color="'warning'" />
            <vcs-action-button-list
              v-if="item.actions?.length > 0"
              :actions="item.actions"
              :disabled="item.disabled"
              :block-overflow="true"
              :overflow-count="actionButtonListOverflowCount"
            />
          </template>
        </v-list-item>
        <slot name="item.intermediate" :item="item" :index="index" />
        <div
          v-if="hasIntermediateSlot"
          :key="`item-intermediate-child-balance-${index}`"
        />
      </div>
    </v-list>
  </div>
</template>

<script>
  import {
    computed,
    getCurrentInstance,
    inject,
    isReactive,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import { VList, VListItem, VIcon, VListItemTitle } from 'vuetify/components';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.vue';
  import VcsBadge from '../notification/VcsBadge.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';

  /**
   * @param {import("vue").Ref<VcsListItem[]>} items
   * @param {import("vue").ShallowRef<VcsListItem[]>} selected
   * @param {function(string, ...any[]):void} emit
   * @returns {Array<import("../../actions/actionHelper.js").VcsAction>}
   */
  export function createSelectionActions(items, selected, emit) {
    return [
      {
        name: 'list.selectAll',
        tooltip: 'list.selectAll',
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
      },
      {
        name: 'list.clearSelection',
        tooltip: 'list.clearSelection',
        callback() {
          [...selected.value].forEach((item) => {
            if (item.selectionChanged) {
              item.selectionChanged(false);
            }
          });
          selected.value = [];
          emit('update:modelValue', selected.value);
        },
      },
    ];
  }

  /**
   * @typedef {Object} VcsListItem
   * @property {string} name
   * @property {boolean} [visible] - Whether to display this item or not.
   * @property {boolean} [disabled] - Whether this item should be displayed as disabled.
   * @property {boolean} [rename] - Whether the title of this item is currently in edit mode.
   * @property {string} title - The title to be displayed
   * @property {string} [tooltip]
   * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} [icon] - An optional icon to display with this item. Can be a URL or HTMLElement.
   * @property {boolean} [hasUpdate] - Shows badge, if item has an update.
   * @property {Array<import("../../actions/actionHelper.js").VcsAction>} [actions]
   * @property {Array<function(PointerEvent):void>|undefined} [clickedCallbacks] - An array of callbacks called on item click. called before selection update
   * @property {function(boolean):void} [selectionChanged] - A callback called if the selection changes with the current selection status. called before value update
   * @property {function(string):void} [titleChanged] - A callback called if the title changes via rename action. called before value update
   */

  /**
   * @typedef {Object} ItemMovedEvent
   * @property {VcsListItem} item
   * @property {number} targetIndex
   */

  /**
   * @typedef {Object} ItemRenamedEvent
   * @property {VcsListItem} item
   * @property {string} newTitle
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
   * @vue-prop {Array<VcsListItem>} items
   * @vue-prop {boolean} [draggable=false]
   * @vue-prop {boolean} [selectable=false]
   * @vue-prop {boolean} [singleSelect=false]
   * @vue-prop {Array<VcsListItem>} [value=[]] - the initial items to be selected.
   * @vue-prop {boolean} [searchable=false] - if this list can have its items searched. you can provide your own predicate function by providing "filterPredicate" which is of type function(VcsListItem, string):boolean
   * @vue-prop {string} [searchbarPlaceholder] - placeholder to render inside the search field
   * @vue-prop {boolean} [showTitle=true] - show the title component
   * @vue-prop {number} [actionButtonListOverflowCount] - overflow count to use for action lists in the title and items
   * @vue-prop {string} [title] - the lists title
   * @vue-prop {string} [icon] - icon to prepend to the list title
   * @vue-prop {string} [tooltip] - tooltip to render on the list title
   * @vue-prop {Array<import("../../actions/actionHelper.js").VcsAction>} [actions] - actions to render in the list title
   * @vue-event {ItemMovedEvent} item-moved - event triggered after item was dragged and is dropped
   * @vue-event {ItemRenamedEvent} item-renamed - event triggered after item was renamed
   * @vue-data {slot} [#item.prepend-title] - A slot to adapt the list item titel, adding content before the title. Binds item and index.
   * @vue-data {slot} [#item.title] - A slot to adapt the list item titel. Default content is a span or VcsTextField for active rename action. Binds item and index.
   * @vue-data {slot} [#item.append-title] - A slot to adapt the list item titel, adding content after the title. Binds item and index.
   * @vue-data {slot} [#item.intermediate] - A slot to introduce content, e.g. buttons between two list items. Binds item and index.
   */
  export default {
    name: 'VcsList',
    components: {
      VcsBadge,
      VcsTreeviewSearchbar,
      VcsActionButtonList,
      VcsTooltip,
      VList,
      VListItem,
      VIcon,
      VListItemTitle,
      VcsTextField,
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
      /** @type {import("vue").ShallowRef<Array<VcsListItem>>} */
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
      const titles = ref([]);
      const listHeader = ref(null);

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
      /** @type {function(VcsListItem, string):boolean} */
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
       * @type {VcsListItem|null}
       */
      let draggedItem = null;

      const isDraggable = computed(() => {
        return query.value === '' && props.draggable;
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
       * @param {VcsListItem} item
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
       * @type {import("vue").ComputedRef<Array<VcsListItem>>}
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
         * @type {import("vue").ComputedRef<Array<VcsListItem>>}
         */
        renderingItems,
        /** @type {import("vue").ShallowRef<Array<VcsListItem>>} */
        selected,
        /**
         * @param {import("vue").UnwrapNestedRef<VcsListItem>} item
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
         * @param {import("vue").UnwrapNestedRefs<VcsListItem>} item
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
         * @param {import("vue").UnwrapNestedRefs<VcsListItem>} item
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
        titles,
        overflowTitle(index, alternative) {
          const elem = titles.value[index];
          if (elem && elem.offsetWidth < elem.scrollWidth) {
            return alternative;
          }
          return '';
        },
        listHeader,
        listHeaderTooltip: computed(() => {
          if (props.tooltip) {
            return props.tooltip;
          }
          const elem = listHeader.value;
          if (elem && elem.offsetWidth < elem.scrollWidth) {
            return props.title;
          }
          return '';
        }),
        rename(item, newTitle) {
          if (newTitle) {
            emit('item-renamed', { item, newTitle });
            item.titleChanged?.(newTitle);
          }
        },
        hasIntermediateSlot: computed(() => !!slots['item.intermediate']),
      };
    },
  };
</script>

<style lang="scss" scoped>
  :deep(.v-list) {
    .v-list-item__lighten_even {
      &:nth-child(even) {
        background-color: var(--v-base-lighten4);
      }
    }
    .v-list-item__lighten_odd {
      &:nth-child(odd) {
        background-color: var(--v-base-lighten4);
      }
    }
    .v-list-item__dragged {
      background-color: var(--v-base-lighten2) !important;
    }
    .v-list-item__selected {
      border-left: solid 4px;
      border-left-color: var(--v-primary-base);
      padding-left: 12px !important;
    }
    .v-list-item {
      padding: 4px 8px 4px 16px;
      &.vcs-draggable-item:hover {
        cursor: grab;
        user-select: none;
      }
      &.border-bottom {
        border-bottom: solid;
        border-bottom-color: var(--v-base-lighten2);
      }
      &.border-top {
        border-top: solid;
        border-top-color: var(--v-base-lighten2);
      }
      &:after {
        display: none;
      }
      &.font-weight-bold {
        .v-list-item__title {
          font-weight: 700;
        }
      }
      .v-list-item__action {
        .v-icon {
          font-size: 16px;
        }
        &:last-child {
          min-width: auto;
        }
      }
      .v-list-item__content {
        flex-wrap: nowrap;
        column-gap: 4px;
        .v-icon,
        .action-btn-wrap {
          flex: 1 1 auto;
        }
        .v-icon {
          font-size: 16px;
          .v-icon__component {
            width: 16px;
            height: 16px;
          }
        }
      }
    }
  }
  .d-contents {
    display: contents;
  }
</style>
