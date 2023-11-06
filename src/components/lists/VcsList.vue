<template>
  <div class="d-contents">
    <vcs-treeview-searchbar
      v-if="searchable"
      :placeholder="searchbarPlaceholder"
      v-model="query"
    />
    <v-list dense>
      <v-list-item v-if="showTitle" class="font-weight-bold">
        <v-list-item-action v-if="selectable">
          <v-spacer v-if="singleSelect" />
          <v-icon
            v-else-if="
              selected.length ===
              renderingItems.filter((item) => !item.disabled).length
            "
            @click="clear"
          >
            mdi-check-circle
          </v-icon>
          <v-icon
            v-else-if="
              selected.length > 0 && selected.length < renderingItems.length
            "
            @click="selectAll()"
          >
            mdi-minus-circle
          </v-icon>
          <v-icon v-else @click="selectAll()"> mdi-circle-outline </v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <v-icon v-if="icon">
            {{ icon }}
          </v-icon>
          <VcsTooltip :tooltip="$t(listHeaderTooltip)">
            <template #activator="{ on, attrs }">
              <v-list-item-title v-bind="attrs" v-on="on" ref="listHeader">
                {{ $t(title) }}
              </v-list-item-title>
            </template>
          </VcsTooltip>
          <vcs-action-button-list
            v-if="actions?.length > 0"
            :actions="actions"
            :block-overflow="true"
            :overflow-count="actionButtonListOverflowCount"
          />
        </v-list-item-content>
      </v-list-item>
      <v-list-item
        v-for="(item, index) in renderingItems"
        :key="`item-${index}`"
        :input-value="selected.includes(item)"
        :disabled="item.disabled"
        @mousedown.shift="$event.preventDefault()"
        @mouseover="hovering = index"
        @mouseout="hovering = undefined"
        :draggable="isDraggable"
        @dragstart="drag($event, item, index)"
        @mouseup="drop($event, index)"
        :class="{
          'v-list-item__lighten_even': lightenEven,
          'v-list-item__lighten_odd': !lightenEven,
          'vcs-draggable-item': isDraggable,
          'v-list-item__dragged': dragging === index,
          'border-bottom': borderBottom(index),
          'border-top': borderTop(index),
        }"
      >
        <v-list-item-action v-if="selectable">
          <v-icon v-if="selected.includes(item)" @click="remove(item)">
            mdi-check-circle
          </v-icon>
          <v-icon
            v-else
            @click="singleSelect ? select(item, $event) : add(item)"
          >
            mdi-circle-outline
          </v-icon>
        </v-list-item-action>
        <v-list-item-content
          :class="[selectable && !isDraggable ? 'cursor-pointer' : '']"
          @click="select(item, $event)"
        >
          <v-icon v-if="item.icon">
            {{ item.icon }}
          </v-icon>
          <VcsTooltip
            :tooltip="
              dragging !== undefined
                ? undefined
                : $t(item.tooltip || overflowTitle(index, item.title))
            "
          >
            <template #activator="{ on, attrs }">
              <v-list-item-title v-bind="attrs" v-on="on" ref="titles">
                {{ $t(item.title) }}
              </v-list-item-title>
            </template>
          </VcsTooltip>
        </v-list-item-content>
        <VcsBadge v-if="item.hasUpdate" :color="'warning'" />
        <v-list-item-action>
          <vcs-action-button-list
            v-if="item.actions?.length > 0"
            :actions="item.actions"
            :disabled="item.disabled"
            :block-overflow="true"
            :overflow-count="actionButtonListOverflowCount"
          />
        </v-list-item-action>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
  import { computed, getCurrentInstance, inject, ref, watch } from 'vue';
  import {
    VList,
    VListItem,
    VListItemContent,
    VListItemAction,
    VIcon,
    VListItemTitle,
    VSpacer,
  } from 'vuetify/lib';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.vue';
  import VcsBadge from '../notification/VcsBadge.vue';

  /**
   * @typedef {Object} VcsListItem
   * @property {string} name
   * @property {boolean} [visible] - Whether to display this item or not.
   * @property {boolean} [disabled] - Whether this item should be displayed as disabled.
   * @property {string} title - The title to be displayed
   * @property {string} [tooltip]
   * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} [icon] - An optional icon to display with this item. Can be a URL or HTMLElement.
   * @property {boolean} [hasUpdate] - Shows badge, if item has an update.
   * @property {Array<VcsAction>} [actions]
   * @property {function(boolean):void} [selectionChanged] - A callback called if the selection changes with the current selection status. called before value update
   */

  /**
   * @typedef {Object} ItemMovedEvent
   * @property {VcsListItem} item
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
   * @vue-prop {Array<VcsAction>} [actions] - actions to render in the list title
   * @vue-event {ItemMovedEvent} item-moved - event triggered after item was dragged and is dropped
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
      VListItemContent,
      VListItemAction,
      VIcon,
      VListItemTitle,
      VSpacer,
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
      value: {
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
        default: undefined,
      },
    },
    setup(props, { emit }) {
      /** @type {import("vue").Ref<Array<VcsListItem>>} */
      const selected = ref(props.value);
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
          if (selected.value !== props.value) {
            selected.value = props.value;
          }
          if (props.singleSelect && selected.value.length > 1) {
            selected.value
              .filter((i, index) => index && i.selectionChanged)
              .forEach((i) => i.selectionChanged(false));
            selected.value = [selected.value[0]];
            emit('input', selected);
          }
          if (!props.selectable && selected.value.length > 0) {
            selected.value
              .filter((i) => i.selectionChanged)
              .forEach((i) => i.selectionChanged(false));
            selected.value = [];
            emit('input', selected);
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
          const translatedTitle = vm.$t(item.title);
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

      return {
        query,
        hovering,
        dragging,
        isDraggable,
        borderBottom,
        borderTop,
        lightenEven,
        /**
         * @type {import("vue").ComputedRef<Array<VcsListItem>>}
         */
        renderingItems: computed(() => {
          let items = props.items.filter((i) => i.visible !== false);
          if (query.value) {
            items = items.filter((i) => filterPredicate(i, query.value));
          }
          return items;
        }),
        /** @type {import("vue").Ref<Array<VcsListItem>>} */
        selected,
        /**
         * @param {VcsListItem} item
         * @param {PointerEvent} event
         */
        select(item, event) {
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
              firstIndex = this.renderingItems.indexOf(firstSelected);
            }
            const currentIndex = this.renderingItems.indexOf(item);
            if (firstIndex > -1 && currentIndex > -1) {
              const currentSelection = [...selected.value];
              selected.value = this.renderingItems.slice(
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
                .forEach((i) => i.selectionChanged(false));
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

          emit('input', selected.value);
        },
        /**
         * @param {VcsListItem} item
         */
        add(item) {
          if (!selected.value.includes(item) && !item.disabled) {
            item.selectionChanged?.(true);
            selected.value = [...selected.value, item];
            emit('input', selected.value);
          }
        },
        /**
         * @param {VcsListItem} item
         */
        remove(item) {
          if (selected.value.includes(item) && !item.disabled) {
            item.selectionChanged?.(false);
            selected.value = selected.value.filter((i) => i !== item);
            emit('input', selected.value);
          }
        },
        clear() {
          selected.value
            .filter((i) => i.selectionChanged)
            .forEach((i) => i.selectionChanged(false));
          selected.value = [];
          firstSelected = null;
          emit('input', selected.value);
        },
        selectAll() {
          const currentSelection = [...selected.value];
          selected.value = this.renderingItems.filter((item) => !item.disabled);
          selected.value.forEach((item) => {
            if (item.selectionChanged && !currentSelection.includes(item)) {
              item.selectionChanged(true);
            }
          });
          emit('input', selected.value);
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
      };
    },
  };
</script>

<style lang="scss" scoped>
  ::v-deep {
    .v-list {
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
  }
</style>
