<template>
  <div
    class="d-contents"
  >
    <vcs-treeview-searchbar
      v-if="searchable"
      :placeholder="searchbarPlaceholder"
      v-model="query"
    />
    <v-list
      dense
    >
      <v-list-item
        v-if="showTitle"
        class="font-weight-bold"
      >
        <v-list-item-action
          v-if="selectable"
        >
          <v-icon
            v-if="selected.length === renderingItems.length"
            @click="clear"
          >
            mdi-check-circle-outline
          </v-icon>
          <v-icon
            v-else
            @click="selectAll()"
          >
            mdi-circle-outline
          </v-icon>
        </v-list-item-action>

        <v-list-item-content>
          <v-icon v-if="icon">
            {{ icon }}
          </v-icon>

          <VcsTooltip
            :tooltip="tooltip || title"
          >
            <template #activator="{ on, attrs }">
              <v-list-item-title v-bind="attrs" v-on="on">
                {{ $t(title) }}
              </v-list-item-title>
            </template>
          </VcsTooltip>

          <vcs-action-button-list
            v-if="actions?.length > 0"
            :actions="actions"
            :block-overflow="true"
            :overflow-count="actionButtonListOverflowCount"
            small
            right
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
        @mouseout="hovering = null"
      >
        <v-list-item-action
          v-if="selectable"
        >
          <v-icon
            v-if="selected.includes(item)"
            @click="remove(item)"
          >
            mdi-check-circle-outline
          </v-icon>
          <v-icon
            v-else-if="hovering === index || (!singleSelect && selected.length > 0)"
            @click="singleSelect ? select(item, $event) : add(item)"
          >
            mdi-circle-outline
          </v-icon>
          <v-icon
            v-else
            @click="select(item, $event)"
          >
            mdi-circle-small
          </v-icon>
        </v-list-item-action>

        <v-list-item-content
          :class="[selectable ? 'cursor-pointer' : '']"
          @click="select(item, $event)"
        >
          <v-icon v-if="item.icon">
            {{ item.icon }}
          </v-icon>

          <VcsTooltip
            :tooltip="item.tooltip || item.title"
          >
            <template #activator="{ on, attrs }">
              <v-list-item-title v-bind="attrs" v-on="on">
                {{ $t(item.title) }}
              </v-list-item-title>
            </template>
          </VcsTooltip>

          <vcs-action-button-list
            v-if="item.actions?.length > 0"
            :actions="item.actions"
            :block-overflow="true"
            :overflow-count="actionButtonListOverflowCount"
            small
            right
          />
        </v-list-item-content>
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
  } from 'vuetify/lib';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import VcsTooltip from '../notification/VcsTooltip.vue';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.vue';

  /**
   * @typedef {Object} VcsListItem
   * @property {string} name
   * @property {boolean} [visible] - Whether to display this item or not.
   * @property {boolean} [disabled] - Whether this item should be displayed as disabled.
   * @property {string} title - The title to be displayed
   * @property {string} [tooltip]
   * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} [icon] - An optional icon to display with this item. Can be an URL or HTMLElement.
   * @property {Array<VcsAction>} [actions]
   * @property {function(boolean):void} [selectionChanged] - A callback called if the selection changes with the current selection status. called before value update
   */

  /**
   * The VCS list is intended to render items. Items can be selectable (by default, more then one) or only a single item can
   * be selected. If items are disabled they cannot selected. Items which are not visible are not rendered. This items can
   * no longer be selected or deselected either. Making a selected item invisible can lead to undefined behavior
   * in the selection state.
   * Clicking an unselected item selects it.
   * Clicking a selected item which is not part of a set or range, deselects it.
   * Clicking a selected item of a list or range will deselect the other items in the range or set
   * Clicking with CTRL adds or removes to a selection set.
   * Clicking with SHIFT will create a selection range, starting or ending with the first item in the list
   * or the last normally selected item (not the last item clicked with CTRL for instance).
   * @vue-prop {Array<VcsListItem>} items
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
   */
  export default {
    name: 'VcsList',
    components: {
      VcsTreeviewSearchbar,
      VcsActionButtonList,
      VcsTooltip,
      VList,
      VListItem,
      VListItemContent,
      VListItemAction,
      VIcon,
      VListItemTitle,
    },
    props: {
      /** @type {Array<VcsListItem>} */
      items: {
        type: Array,
        required: true,
      },
      selectable: {
        type: Boolean,
        default: false,
      },
      singleSelect: {
        type: Boolean,
        default: false,
      },
      /** @type {Array<VcsListItem>} */
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
      const hovering = ref(null);
      let firstSelected = null;

      watch(props, () => {
        if (selected.value !== props.value) {
          selected.value = props.value;
        }
        if (props.singleSelect && selected.value.length > 1) {
          selected.value
            .filter((i, index) => index && i.selectionChanged)
            .forEach(i => i.selectionChanged(false));
          selected.value = [selected.value[0]];
          emit('input', selected);
        }
        if (!props.selectable && selected.value.length > 0) {
          selected.value
            .filter(i => i.selectionChanged)
            .forEach(i => i.selectionChanged(false));
          selected.value = [];
          emit('input', selected);
        }
        if (!props.searchable) {
          query.value = '';
        }
      }, { immediate: true, deep: false });

      const vm = getCurrentInstance().proxy;
      /** @type {function(VcsListItem, string):boolean} */
      const filterPredicate = inject('filterPredicate', (item, queryString = '') => {
        const translatedTitle = vm.$t(item.title);
        return translatedTitle.toLocaleLowerCase().includes(queryString.toLocaleLowerCase());
      });

      return {
        query,
        hovering,
        /**
         * @type {import("vue").ComputedRef<Array<VcsListItem>>}
         */
        renderingItems: computed(() => {
          let items = props.items.filter(i => i.visible !== false);
          if (query.value) {
            items = items.filter(i => filterPredicate(i, query.value));
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
                if (oldItem.selectionChanged && !selected.value.includes(oldItem)) {
                  oldItem.selectionChanged(false);
                }
              });
              selected.value.forEach((newItem) => {
                if (newItem.selectionChanged && !currentSelection.includes(newItem)) {
                  newItem.selectionChanged(true);
                }
              });
            } else {
              selected.value
                .filter(i => i !== item && i.selectionChanged)
                .forEach(i => i.selectionChanged(false));
              selected.value = [];
              firstSelected = null;
            }
          } else if (selected.value.includes(item)) {
            if (event.ctrlKey) {
              item.selectionChanged?.(false);
              selected.value = selected.value.filter(i => i !== item);
            } else if (selected.value.length > 1) {
              selected.value
                .filter(i => i !== item && i.selectionChanged)
                .forEach(i => i.selectionChanged(false));
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
              .filter(i => i !== item && i.selectionChanged)
              .forEach(i => i.selectionChanged(false));
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
            selected.value = selected.value.filter(i => i !== item);
            emit('input', selected.value);
          }
        },
        clear() {
          selected.value
            .filter(i => i.selectionChanged)
            .forEach(i => i.selectionChanged(false));
          selected.value = [];
          firstSelected = null;
          emit('input', selected.value);
        },
        selectAll() {
          const currentSelection = [...selected.value];
          selected.value = this.renderingItems.slice(0);
          selected.value.forEach((item) => {
            if (item.selectionChanged && !currentSelection.includes(item)) {
              item.selectionChanged(true);
            }
          });
          emit('input', selected.value);
        },
      };
    },
  };
</script>

<style lang="scss" scoped>
  ::v-deep {
    .v-list {
      .v-list-item {
        padding: 4px 8px 4px 16px;
        &:after{
          display: none;
        }
        &.font-weight-bold {
          .v-list-item__title {
            font-weight: 700;
          }
        }
        &:nth-child(even) {
          background-color: var(--v-base-lighten4);
        }
        .v-list-item__action {
          .v-icon {
            font-size: 16px;
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
