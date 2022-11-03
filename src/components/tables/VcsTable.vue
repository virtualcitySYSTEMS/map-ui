<template>
  <v-card>
    <VcsTreeviewSearchbar
      v-if="showSearchbar"
      :placeholder="$t(searchbarPlaceholder)"
      v-model="search"
    />
    <v-data-table
      dense
      item-key="key"
      :headers="translatedHeaders"
      :items="items"
      :items-per-page.sync="itemsPerPageRef"
      :page.sync="page"
      :search="search"
      :custom-filter="handleFilter"
      hide-default-footer
      class="vcs-table"
    >
      <!-- eslint-disable-next-line -->
      <template #item.key="{ item }">
        <td class="vcs-table px-2 overflow-max-width" :title="$t(item.key)">
          {{ $t(item.key) }}
        </td>
      </template>
      <!-- eslint-disable-next-line -->
      <template #item.value="{ item }">
        <td class="vcs-table px-2 overflow-max-width" :title="$t(item.value)">
          {{ $t(item.value) }}
        </td>
      </template>
      <template #footer>
        <v-divider />
        <v-container class="pa-2 vcs-pagination-bar accent" v-if="items.length > itemsPerPageRef">
          <v-row
            dense
            no-gutters
            align="center"
            justify="center"
          >
            <v-menu offset-y dense>
              <template #activator="{ on, attrs }">
                <VcsButton
                  small
                  color="primary"
                  v-bind="attrs"
                  v-on="on"
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
                  style="min-height: auto; height: 24px; text-align: right;"
                >
                  <v-list-item-title>{{ number }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <span class="mx-2">{{ $t('components.vcsTable.itemsPerPage') }}</span>
            <span class="mx-2">
              {{ itemsFrom }} - {{ itemsTo }} {{ $t('components.vcsTable.ofItems') }} {{ numberOfItems }}
            </span>
            <VcsButton
              small
              icon="mdi-chevron-left"
              @click="formerPage"
              tooltip="components.vcsTable.formerPage"
              :disabled="page < 2"
              class="ml-1"
            />
            <VcsButton
              small
              icon="mdi-chevron-right"
              @click="nextPage"
              tooltip="components.vcsTable.nextPage"
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
   * @typedef {Object} TableItem
   * @property {string} key
   * @property {string} value
   */

  /**
   * @param {Object} attributes
   * @param {Array<TableItem>} [items]
   * @param {string} [parent]
   * @returns {Array<TableItem>}
   */
  export function attributesToItems(attributes, items = [], parent = undefined) {
    const nestedKey = (key, nested) => (nested ? `${nested}.${key}` : key);
    Object.entries(attributes).forEach(([key, value]) => {
      if (value instanceof Object) {
        attributesToItems(value, items, nestedKey(key, parent));
      } else {
        const item = { key: nestedKey(key, parent), value };
        if (parent) { item.group = parent; }
        items.push(item);
      }
    });
    return items;
  }

  /**
   * @description A table view for feature attributes using {@link https://vuetifyjs.com/en/api/v-data-table/#props v-data-table }
   * @vue-prop {string} featureId - feature's id
   * @vue-prop {Object} attributes - feature's attributes
   * @vue-prop {Array<{text: string, value: string}>} [headers] - optional array defining column names
   * @vue-prop {boolean} [showSearchbar=true] - whether to show searchbar
   * @vue-prop {string} [searchbarPlaceholder='Search'] - placeholder for searchbar
   * @vue-computed {Array<TableItem>} items - from attributes derived table items
   * @vue-computed {Array<TableItem>} filteredItems - array of items with search filter applied on. If search string is empty, same as items array.
   * @vue-computed {number} numberOfItems - number of filtered items (depending on search).
   * @vue-computed {number} numberOfPages - number of pages depending on number of items, search and itemsPerPage.
   * @vue-computed {number} itemsFrom - index of first item shown on current page.
   * @vue-computed {number} itemsTo - index of last item shown on current page.
   */
  export default {
    name: 'VcsTable',
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
      featureId: {
        type: String,
        required: true,
      },
      attributes: {
        type: Object,
        required: true,
      },
      headers: {
        type: Array,
        default: () => [
          { text: 'components.vcsTable.key', value: 'key', width: '160px' },
          { text: 'components.vcsTable.value', value: 'value', width: '160px' },
        ],
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
        default: 'components.vcsTable.searchbarPlaceholder',
      },
    },
    setup(props) {
      const vm = getCurrentInstance().proxy;
      /**
       * @type {Ref<UnwrapRef<string>>}
       */
      const search = ref('');
      /**
       * @type {ComputedRef<Array<TableItem>>}
       */
      const items = computed(() => {
        return attributesToItems({
          featureId: props.featureId,
          ...props.attributes,
        });
      });

      /**
       * @param {any} value
       * @param {string|undefined} filter
       * @param {TableItem} item
       * @returns {boolean}
       */
      const handleFilter = (value, filter, item) => {
        if (filter) {
          const q = filter.toLocaleLowerCase();
          return [item.key, item.value].some((i) => {
            const content = i.toString();
            const translated = vm.$t(content);
            return translated.toLowerCase().includes(q) || content.toLowerCase().includes(q);
          });
        }
        return true;
      };

      /**
       * @type {ComputedRef<TableItem[]>}
       */
      const filteredItems = computed(() => items.value.filter(item => handleFilter(item.value, search.value, item)));
      const numberOfItems = computed(() => filteredItems.value.length);

      /**
       * @type {ComputedRef<Array<{text: string, value: string}>>}
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
        return Math.ceil(numberOfItems.value / itemsPerPageRef.value);
      });
      /**
       * @type {Ref<UnwrapRef<number>>}
       */
      const page = ref(1);
      const itemsFrom = computed(() => ((page.value - 1) * itemsPerPageRef.value) + 1);
      const itemsTo = computed(() => {
        const last = page.value * itemsPerPageRef.value;
        return last < numberOfItems.value ? last : numberOfItems.value;
      });

      return {
        search,
        page,
        items,
        filteredItems,
        itemsPerPageRef,
        itemsFrom,
        itemsTo,
        numberOfPages,
        numberOfItems,
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
        translatedHeaders,
      };
    },
  };
</script>

<style lang="scss" scoped>
::v-deep{
  .vcs-table {
    td {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      &.overflow-max-width{
        max-width: 160px;
      }
      &.v-data-table__mobile-row{
        justify-content: left;
        height: 27px;
        min-height: auto;
      }
    }
    th.sortable{
      padding: 0 8px;
      span{
        vertical-align: middle;
        padding: 0 4px 0 0;
      }
    }
  }
  .v-data-table__mobile-row__cell{
    td.vcs-table.overflow-max-width{
      max-width: 260px;
    }
  }
  .v-btn.vcs-button--small{
    height: 100% !important;
    display: block;
  }
}
.vcs-pagination-bar{
  .vcs-button-wrap{
    height: 25px;
    border: 1px solid lightgrey;
    padding: 0 4px;
    background-color: var(--v-basic-base);
    border-radius: 4px;
  }
}
</style>
