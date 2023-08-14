<template>
  <v-card>
    <VcsTreeviewSearchbar
      v-if="showSearchbar"
      :placeholder="$t(searchbarPlaceholder)"
      v-model="search"
      @input="handleSearch"
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
      dense
      :headers="translatedHeaders"
      :items="items"
      :item-key="itemKey"
      :items-per-page.sync="itemsPerPageRef"
      :page.sync="page"
      :search="search"
      :custom-filter="handleFilter"
      :no-data-text="
        $attrs.noDataText ?? $t('components.vcsDataTable.noDataPlaceholder')
      "
      :no-results-text="
        $attrs.noResultsText ??
        $t('components.vcsDataTable.noResultsPlaceholder')
      "
      :single-select="singleSelect"
      :server-items-length="serverItemsLength"
      hide-default-footer
      v-bind="$attrs"
      v-on="$listeners"
      class="vcs-table rounded-0"
      @update:options="(o) => $emit('update:items', { ...o, search })"
    >
      <!-- eslint-disable-next-line -->
      <template v-for="(_, slot) of $scopedSlots" #[slot]="scope">
        <slot
          v-if="!['prepend', 'default', 'append'].includes(slot)"
          :name="slot"
          v-bind="scope"
        />
      </template>
      <!-- eslint-disable-next-line -->
      <template v-slot:header.data-table-select="{ props, on }">
        <div v-if="on">
          <v-icon
            v-if="value.length === totalNumber"
            @click="on.input(false)"
            class="vcs-select-icon"
          >
            mdi-check-circle
          </v-icon>
          <v-icon
            v-else-if="props.indeterminate"
            @click="on.input(true)"
            class="vcs-select-icon"
          >
            mdi-minus-circle
          </v-icon>
          <v-icon v-else @click="on.input(true)" class="vcs-select-icon">
            mdi-circle-outline
          </v-icon>
        </div>
      </template>
      <!-- eslint-disable-next-line -->
      <template #item.data-table-select="{ isSelected, select, item, index }">
        <div @mouseover="hovering = index" @mouseout="hovering = null">
          <v-icon
            v-if="isSelected"
            :disabled="item.disabled"
            @click="select(!isSelected)"
            class="vcs-select-icon"
          >
            mdi-check-circle
          </v-icon>
          <v-icon
            v-else-if="
              hovering === index || (!singleSelect && value.length > 0)
            "
            :disabled="item.disabled"
            @click="select(!isSelected)"
            class="vcs-select-icon"
          >
            mdi-circle-outline
          </v-icon>
          <v-icon
            v-else
            :disabled="item.disabled"
            @click="select(!isSelected)"
            class="vcs-select-icon"
          >
            mdi-circle-small
          </v-icon>
        </div>
      </template>
      <template #footer v-if="showFooter">
        <v-divider />
        <v-container class="pa-2 vcs-pagination-bar">
          <v-row dense no-gutters justify="center" class="align-center">
            <v-menu offset-y dense>
              <template #activator="{ on, attrs }">
                <VcsButton color="primary" v-bind="attrs" v-on="on">
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
              class="ml-1"
            />
            <VcsButton
              icon="mdi-chevron-right"
              @click="nextPage"
              tooltip="components.vcsDataTable.nextPage"
              :disabled="page > numberOfPages - 1"
              class="ml-1"
            />
          </v-row>
        </v-container>
      </template>
    </v-data-table>
  </v-card>
</template>
<script>
  import { getCurrentInstance, ref, computed } from 'vue';
  import {
    VCard,
    VDivider,
    VContainer,
    VDataTable,
    VList,
    VListItem,
    VListItemTitle,
    VMenu,
    VIcon,
    VRow,
  } from 'vuetify/lib';
  import VcsTreeviewSearchbar from '../lists/VcsTreeviewSearchbar.vue';
  import VcsButton from '../buttons/VcsButton.vue';

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
   * @vue-prop {string} itemKey - the key property, which is unique on all items.
   * @vue-prop {number} serverItemsLength - number of total items on a backend. Used for server-side pagination.
   * @vue-prop {number} serverPagesLength - number of total pages on a backend. Used for server-side pagination.
   * @vue-prop {Array<{text: string, value: string}>} [headers] - optional array defining column names. Text will be translated
   * @vue-prop {boolean} [showSearchbar=true] - whether to show searchbar
   * @vue-prop {string} [searchbarPlaceholder] - placeholder for searchbar
   * @vue-prop {boolean} [singleSelect=false]
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
      VcsButton,
      VcsTreeviewSearchbar,
      VCard,
      VDataTable,
      VContainer,
      VDivider,
      VRow,
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
      itemKey: {
        type: String,
        required: true,
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
      singleSelect: {
        type: Boolean,
        default: false,
      },
      value: {
        type: Array,
        default: () => [],
      },
    },
    setup(props, { attrs, emit }) {
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
          return Object.values(item).some((i) => {
            if (i) {
              const content = i.toString();
              const translated = vm.$t(content);
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
          hd.text = vm.$t(hd.text);
          return hd;
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

      return {
        hovering,
        search,
        page,
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
        updateItemsPerPage(number) {
          itemsPerPageRef.value = number;
        },
        handleFilter,
        handleSearch,
        translatedHeaders,
        showFooter,
      };
    },
  };
</script>

<style lang="scss" scoped>
  @import '../../styles/shades.scss';
  @import '../../styles/variables.scss';

  .vcs-select-icon {
    &.v-icon {
      font-size: $input-icon-font-size;

      .v-icon__component {
        width: $input-icon-width;
        height: $input-icon-height;
      }
    }
  }
  ::v-deep {
    .vcs-table {
      tbody tr {
        &:hover {
          background-color: transparent !important;
        }

        &:nth-child(odd) {
          background-color: var(--v-base-lighten4) !important;
        }

        td {
          padding: 0 8px !important;

          &.v-data-table__mobile-row {
            justify-content: left;
            min-height: auto;
            .v-data-table__mobile-row__header {
              min-width: 50px;
            }
          }
        }
      }
    }

    th {
      padding: 0 8px !important;

      &.sortable {
        overflow: hidden;
        white-space: nowrap;

        span {
          vertical-align: middle;
          padding: 0 4px 0 0;

          &.theme--light {
            thead tr th {
              color: map-get($shades, 'black') !important;
            }
          }

          &.theme--dark {
            thead tr th {
              color: map-get($shades, 'white') !important;
            }
          }
        }

        .v-btn.vcs-button {
          height: 100% !important;
          display: block;
        }
      }

      .vcs-pagination-bar {
        .vcs-button-wrap {
          height: 25px;
          border: 1px solid;
          padding: 0 4px;
          border-radius: 4px;

          &:hover {
            border: 1px solid var(--v-primary-base);
          }
        }
      }
    }
  }
</style>
