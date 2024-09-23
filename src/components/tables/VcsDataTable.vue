<template>
  <div class="vcs-data-table">
    <VcsTreeviewSearchbar
      v-if="showSearchbar"
      :placeholder="$st(searchbarPlaceholder)"
      v-model="search"
      @update:model-value="handleSearch"
    >
      <template #prepend="scope">
        <slot name="prepend" v-bind="scope" />
      </template>
      <template #default="scope">
        <slot v-bind="scope" />
      </template>
      <template #append="scope">
        <slot name="append" v-bind="scope" />
      </template>
    </VcsTreeviewSearchbar>
    <v-data-table
      :headers="translatedHeaders"
      :items="internalItems"
      :items-per-page="itemsPerPageRef"
      :search="search"
      :custom-filter="handleFilter"
      :no-data-text="
        $attrs.noDataText ?? $t('components.vcsDataTable.noDataPlaceholder')
      "
      :no-results-text="
        $attrs.noResultsText ??
        $t('components.vcsDataTable.noResultsPlaceholder')
      "
      :item-selectable="itemSelectable"
      hide-default-footer
      class="vcs-table"
      :class="{ 'vcs-table-select': $attrs.showSelect }"
      v-bind="$attrs"
      v-model:page="page"
      v-model:items-per-page="itemsPerPageRef"
      @update:options="(o) => $emit('update:items', { ...o, search })"
    >
      <template v-for="slot of forwardSlots" #[slot]="scope">
        <slot :name="slot" v-bind="scope ?? {}" />
      </template>
      <template
        #header.data-table-select="{ allSelected, selectAll, someSelected }"
      >
        <VcsCheckbox
          :indeterminate="someSelected && !allSelected"
          indeterminate-icon="mdi-minus-circle"
          false-icon="mdi-circle-outline"
          true-icon="mdi-check-circle"
          :model-value="allSelected"
          @update:model-value="selectAll(!allSelected)"
        />
      </template>
      <template
        #item.data-table-select="{ internalItem, isSelected, toggleSelect }"
      >
        <VcsCheckbox
          :model-value="isSelected(internalItem)"
          :disabled="!internalItem.selectable"
          false-icon="mdi-circle-outline"
          true-icon="mdi-check-circle"
          @update:model-value="toggleSelect(internalItem)"
        />
      </template>
      <template #tfoot v-if="showFooter">
        <tfoot>
          <tr class="v-data-table__tr">
            <td colspan="100" class="text-center pa-1">
              <div class="d-inline-block">
                <v-menu>
                  <template #activator="{ props }">
                    <VcsButton
                      color="primary"
                      v-bind="props"
                      class="v-btn--variant-plain mx-2 d-flex flex-wrap"
                    >
                      {{ itemsPerPageRef }}
                      <v-icon>mdi-chevron-down</v-icon>
                    </VcsButton>
                  </template>
                  <v-list>
                    <v-list-item
                      v-for="(number, index) in itemsPerPageArray"
                      :key="index"
                      @click="updateItemsPerPage(number)"
                      style="min-height: auto; height: 24px; text-align: right"
                    >
                      <v-list-item-title>{{ number }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
              <span class="mx-2">{{
                $t('components.vcsDataTable.itemsPerPage')
              }}</span>
              <span class="mx-2">
                {{ itemsFrom }} - {{ itemsTo }}
                {{ $t('components.vcsDataTable.ofItems') }} {{ numberOfItems }}
              </span>
              <VcsButton
                icon="mdi-chevron-left"
                @click="formerPage"
                tooltip="components.vcsDataTable.formerPage"
                :disabled="page < 2"
                class="v-btn--variant-plain ml-1"
              />
              <VcsButton
                icon="mdi-chevron-right"
                @click="nextPage"
                tooltip="components.vcsDataTable.nextPage"
                :disabled="page > numberOfPages - 1"
                class="v-btn--variant-plain ml-1"
              />
            </td>
          </tr>
        </tfoot>
      </template>
    </v-data-table>
  </div>
</template>
<script>
  import { getCurrentInstance, ref, computed, watch } from 'vue';
  import {
    VDataTable,
    VList,
    VListItem,
    VListItemTitle,
    VMenu,
    VIcon,
  } from 'vuetify/components';
  import VcsTreeviewSearchbar from '../lists/VcsTreeviewSearchbar.vue';
  import VcsButton from '../buttons/VcsButton.vue';
  import VcsCheckbox from '../form-inputs-controls/VcsCheckbox.vue';
  import { getForwardSlots } from '../composables.js';

  /**
   * @typedef {Object} UpdateItemsEvent
   * @property {number} page
   * @property {number} itemsPerPage
   * @property {string[]} sortBy
   * @property {boolean[]} sortDesc
   * @property {string[]} groupBy
   * @property {boolean[]} groupDesc
   * @property {boolean} multiSort
   * @property {boolean} mustSort
   * @property {string} search
   */

  /**
   * @description A wrapper around {@link https://vuetifyjs.com/en/api/v-data-table/#props v-data-table } with custom pagination
   * Passes all slots to v-data-table and 'prepend', 'default' and 'append' slots to VcsSearchbar
   * @vue-prop {Array<Object>} items - array of items, where each item must provide a unique key
   * @vue-prop {number} serverItemsLength - number of total items on a backend. Used for server-side pagination.
   * @vue-prop {number} serverPagesLength - number of total pages on a backend. Used for server-side pagination.
   * @vue-prop {Array<{title: string, value: string}>} [headers] - optional array defining column names. Text will be translated
   * @vue-prop {boolean} [showSearchbar=true] - whether to show searchbar
   * @vue-prop {string} [searchbarPlaceholder] - placeholder for searchbar
   * @vue-prop {string} [itemSelectable='isSelectable'] - The property on each item that is used to determine if it is selectable or not. Non-selectable items are automatically disabled.
   * @vue-event {UpdateItemsEvent} update:items - Emits when one of the options properties is updated or on search input. Can be used to update items via API call to a server.
   * @vue-computed {Array<TableItem>} filteredItems - array of items with search filter applied on. If search string is empty, same as items array.
   * @vue-computed {Array<import("vuetify").DataTableHeader>} translatedHeaders - array of translated header items.
   * @vue-computed {number} numberOfItems - number of filtered items (depending on search).
   * @vue-computed {number} numberOfPages - number of pages depending on number of items, search and itemsPerPage.
   * @vue-computed {number} itemsFrom - index of first item shown on current page.
   * @vue-computed {number} itemsTo - index of last item shown on current page.
   */
  export default {
    name: 'VcsDataTable',
    components: {
      VcsCheckbox,
      VcsButton,
      VcsTreeviewSearchbar,
      VDataTable,
      VMenu,
      VIcon,
      VList,
      VListItem,
      VListItemTitle,
    },
    props: {
      headers: {
        type: Array,
        default: () => [],
      },
      items: {
        type: Array,
        default: () => [],
      },
      serverItemsLength: {
        type: Number,
        default: -1,
      },
      serverPagesLength: {
        type: Number,
        default: -1,
      },
      itemsPerPage: {
        type: Number,
        default: 10,
      },
      itemsPerPageArray: {
        type: Array,
        default: () => [5, 10, 15],
      },
      showSearchbar: {
        type: Boolean,
        default: true,
      },
      searchbarPlaceholder: {
        type: String,
        default: 'components.vcsDataTable.searchbarPlaceholder',
      },
      itemSelectable: {
        type: String,
        default: 'isSelectable',
      },
    },
    setup(props, { attrs, emit, slots }) {
      const vm = getCurrentInstance().proxy;
      const hovering = ref(null);
      /**
       * @type {Ref<UnwrapRef<string>>}
       */
      const search = ref('');

      /**
       * @param {any} value
       * @param {string|undefined} filter
       * @param {TableItem} item
       * @returns {boolean}
       */
      const handleFilter = (value, filter, item) => {
        if (filter) {
          const q = filter.toLocaleLowerCase();
          return Object.values(item.raw).some((i) => {
            if (i) {
              const content = i.toString();
              const translated = vm.$st(content);
              return (
                translated.toLowerCase().includes(q) ||
                content.toLowerCase().includes(q)
              );
            }
            return false;
          });
        }
        return true;
      };

      /**
       * Syncs disabled and isSelectable (or custom item-selectable key) on items
       * @type {ComputedRef<Array<Object>>}
       */
      const internalItems = computed(() =>
        props.items.map((item) => {
          if (
            item.disabled !== undefined &&
            item[props.itemSelectable] === undefined
          ) {
            item[props.itemSelectable] = !item.disabled;
          } else if (
            item.disabled === undefined &&
            item[props.itemSelectable] !== undefined
          ) {
            item.disabled = !item[props.itemSelectable];
          }
          return item;
        }),
      );

      /**
       * @type {ComputedRef<Array<Object>>}
       */
      const filteredItems = computed(() =>
        props.items.filter((item) =>
          handleFilter(item.value, search.value, item),
        ),
      );
      const numberOfItems = computed(() => {
        if (props.serverItemsLength > -1) {
          return props.serverItemsLength;
        }
        return filteredItems.value.length;
      });
      const totalNumber = computed(() => props.items.length);

      /**
       * @type {ComputedRef<Array<Object>>}
       */
      const translatedHeaders = computed(() => {
        return props.headers.map((hd) => {
          return {
            ...hd,
            title: vm.$st(hd.title),
          };
        });
      });

      /**
       * @type {Ref<UnwrapRef<number>>}
       */
      const itemsPerPageRef = ref(props.itemsPerPage);
      const numberOfPages = computed(() => {
        if (props.serverPagesLength > -1) {
          return props.serverPagesLength;
        }
        return Math.ceil(numberOfItems.value / itemsPerPageRef.value);
      });
      /**
       * @type {Ref<UnwrapRef<number>>}
       */
      const page = ref(1);
      const itemsFrom = computed(
        () => (page.value - 1) * itemsPerPageRef.value + 1,
      );
      const itemsTo = computed(() => {
        const last = page.value * itemsPerPageRef.value;
        return last < numberOfItems.value ? last : numberOfItems.value;
      });

      const updateItemsPerPage = (number) => {
        itemsPerPageRef.value = number;
      };

      watch(() => props.itemsPerPage, updateItemsPerPage);

      watch(
        () => props.items,
        () => {
          if (
            props.serverPagesLength === -1 &&
            props.serverItemsLength === -1
          ) {
            page.value = 1;
          }
        },
      );

      const handleSearch = () => {
        page.value = 1;
        const { sortBy, sortDesc, groupBy, groupDesc, multiSort, mustSort } =
          attrs;
        // attrs of v-data-table cannot be accessed outside this component but are necessary for server-side pagination and search
        // hence all relevant variables are emitted
        emit('update:items', {
          page: page.value,
          itemsPerPage: itemsPerPageRef.value,
          sortBy,
          sortDesc,
          groupBy,
          groupDesc,
          multiSort,
          mustSort,
          search: search.value,
        });
      };

      const showFooter = computed(
        () =>
          props.items.length > itemsPerPageRef.value ||
          props.serverItemsLength > itemsPerPageRef.value,
      );

      const forwardSlots = getForwardSlots(slots, [
        'prepend',
        'default',
        'append',
      ]);

      return {
        hovering,
        search,
        page,
        internalItems,
        filteredItems,
        itemsPerPageRef,
        itemsFrom,
        itemsTo,
        numberOfPages,
        numberOfItems,
        totalNumber,
        nextPage() {
          if (page.value + 1 <= numberOfPages.value) {
            page.value += 1;
          }
        },
        formerPage() {
          if (page.value - 1 >= 1) {
            page.value -= 1;
          }
        },
        updateItemsPerPage,
        handleFilter,
        handleSearch,
        translatedHeaders,
        showFooter,
        forwardSlots,
      };
    },
  };
</script>

<style lang="scss" scoped>
  :deep(.vcs-table-select > .v-table__wrapper) {
    table tbody tr {
      td {
        padding: 0 8px !important;
        &:first-child {
          width: 32px !important;
          padding: 0 0 !important;
        }
      }
    }
    table thead tr {
      th {
        padding: 0 8px !important;
        &:first-child {
          width: 32px !important;
          padding: 0 0 !important;
        }
      }
    }
  }

  :deep(.vcs-table > .v-table__wrapper) {
    overflow-x: hidden;
    overflow-y: auto;

    table tbody tr {
      &:hover {
        background-color: transparent !important;
      }

      &:nth-child(odd) {
        background-color: rgb(var(--v-theme-base-lighten-4)) !important;
      }

      td {
        padding: 0 8px;
        border-bottom: transparent !important;
      }
    }
    table thead tr {
      th {
        padding: 0 8px;
      }
    }
  }

  .v-table--density-compact {
    --v-table-header-height: calc(var(--v-vcs-font-size) * 2 + 6px);
    --v-table-row-height: calc(var(--v-vcs-font-size) * 2 + 6px);
    & :deep(.v-selection-control--density-default) {
      --v-selection-control-size: calc(var(--v-vcs-font-size) * 2 + 6px);
    }
  }

  :deep(.v-table > .v-table__wrapper > table > thead > tr > th) {
    font-weight: bold;
  }

  .vcs-footer {
    vertical-align: middle !important;
  }

  // remove ripple effect for hover
  :deep(.v-selection-control__input::before) {
    background-color: transparent;
  }
</style>
