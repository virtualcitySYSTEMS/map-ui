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
        <td class="vcs-table">
          {{ $t(item.key) }}
        </td>
      </template>
      <!-- eslint-disable-next-line -->
      <template #item.value="{ item }">
        <td class="vcs-table">
          {{ $t(item.value) }}
        </td>
      </template>
      <template #footer>
        <v-divider />
        <v-container class="pa-2" v-if="items.length > itemsPerPageRef">
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
                >
                  <v-list-item-title>{{ number }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <span class="grey--text mx-2">{{ $t('components.vcsTable.itemsPerPage') }}</span>
            <span class="grey--text mx-2">{{ itemsFrom }} - {{ itemsTo }} of {{ items.length }}</span>
            <VcsButton
              small
              icon="mdi-chevron-left"
              @click="formerPage"
              tooltip="components.vcsTable.formerPage"
              :disabled="page < 2"
              class="mx-2"
            />
            <VcsButton
              small
              icon="mdi-chevron-right"
              @click="nextPage"
              tooltip="components.vcsTable.nextPage"
              :disabled="page > numberOfPages - 1"
              class="mx-1"
            />
          </v-row>
        </v-container>
      </template>
    </v-data-table>
  </v-card>
</template>
<script>
  import { getCurrentInstance, ref, computed } from 'vue';
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
   * @description A table view for feature attributes using {@link https://vuetifyjs.com/en/api/v-data-table/#props|vuetify v-data-table }
   * @vue-prop {string} featureId - feature's id
   * @vue-prop {Object} attributes - feature's attributes
   * @vue-prop {Array<{text: string, value: string}>} [headers] - optional array defining column names
   * @vue-prop {boolean} [showSearchbar=true] - whether to show searchbar
   * @vue-prop {string} [searchbarPlaceholder='Search'] - placeholder for searchbar
   * @vue-computed {Array<{key:string,value:string}>} items - from attributes derived table items
   */
  export default {
    name: 'VcsTable',
    components: { VcsButton, VcsTreeviewSearchbar },
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

      const items = computed(() => {
        return attributesToItems({
          featureId: props.featureId,
          ...props.attributes,
        });
      });

      const translatedHeaders = computed(() => {
        return props.headers.map((hd) => {
          hd.text = vm.$t(hd.text);
          return hd;
        });
      });

      const itemsPerPageRef = ref(props.itemsPerPage);
      const numberOfPages = computed(() => {
        return Math.ceil(items.value.length / itemsPerPageRef.value);
      });

      const page = ref(1);
      const itemsFrom = computed(() => ((page.value - 1) * itemsPerPageRef.value) + 1);
      const itemsTo = computed(() => {
        const last = page.value * itemsPerPageRef.value;
        return last < items.value.length ? last : items.value.length;
      });

      /**
       * @param {any} value
       * @param {string} search
       * @param {TableItem} item
       * @returns {boolean}
       */
      // eslint-disable-next-line default-param-last
      const handleFilter = (value, search = '', item) => {
        const q = search.toLocaleLowerCase();
        return [item.key, item.value].some((i) => {
          const content = i.toString();
          const translated = vm.$t(content);
          return translated.toLowerCase().includes(q) || content.toLowerCase().includes(q);
        });
      };

      return {
        search: ref(''),
        page,
        items,
        itemsPerPageRef,
        itemsFrom,
        itemsTo,
        numberOfPages,
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

<style lang="scss"  scoped>
.vcs-table {
  td {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
