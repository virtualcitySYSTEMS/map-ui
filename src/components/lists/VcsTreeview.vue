<template>
  <div class="d-contents">
    <VcsTreeviewSearchbar
      v-if="showSearchbar"
      :placeholder="searchbarPlaceholder"
      v-model="localSearchValue"
    />
    <v-treeview
      class="vcs-treeview"
      density="compact"
      item-value="name"
      :item-props="true"
      :custom-filter="handleFilter"
      :selectable="false"
      :activatable="false"
      expand-icon="mdi-chevron-right"
      collapse-icon="mdi-chevron-down"
      v-bind="{ ...$props, ...$attrs }"
      :search="localSearchValue"
    >
      <template #item="{ props: item }">
        <VcsTreeviewLeaf
          @click.stop="item.clicked && !item.disabled && item.clicked($event)"
          :item="item"
        />
      </template>
      <template #title="{ item }">
        {{ $st(item.title || item.name) }}
      </template>
    </v-treeview>
  </div>
</template>
<style lang="scss" scoped>
  :deep(.vcs-treeview) {
    // Root Level Entries should be 40px high
    > .v-list-item,
    > .v-list-group > .v-list-item {
      min-height: calc(var(--v-vcs-item-height) + 8px) !important;
      padding-left: 6px;
    }
    // Border around root nodes with children included
    > .v-list-item:not(:last-child),
    > .v-list-group:not(:last-child) {
      border-bottom: 1px solid rgb(var(--v-theme-base-lighten-2));
    }
    // Only Group Entries have a bold font
    > .v-list-group
      > .v-list-item
      > .v-list-item__content
      > .v-list-item-title {
      font-weight: 700 !important;
    }
  }

  // leaf indent
  :deep(.v-list--slim .v-treeview-group.v-list-group) {
    --prepend-width: 0px;
  }

  // Padding left of root nodes
  :deep(.v-list-item__prepend) {
    width: var(--v-vcs-font-size);
    margin-right: 8px;
    > .v-list-item-action > .v-btn {
      width: var(--v-vcs-font-size);
      height: var(--v-vcs-font-size);
      margin: auto;
    }
  }

  // remove hover shadow over button
  :deep(.v-btn__overlay) {
    --v-hover-opacity: 0;
  }
  // remove ripple effect
  :deep(.v-ripple__container) {
    display: none;
  }
  // hide active class
  :deep(.v-list-item__overlay) {
    display: none;
  }

  .d-contents {
    display: contents;
  }
</style>

<script>
  import { getCurrentInstance } from 'vue';
  import { VTreeview } from 'vuetify/labs/VTreeview';
  import { useProxiedAtomicModel } from '../modelHelper.js';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.vue';
  import VcsTreeviewLeaf from './VcsTreeviewLeaf.vue';

  /**
   * @description extends API of https://vuetifyjs.com/en/api/v-treeview/
   * Can render dynamic components as leaf items.
   * In order to display an item needs to be registered and added to `availableComponents`.
   * Exposes the `search` value for filtering the treeview.
   * @vue-prop {boolean} [showSearchbar=false] - Whether there is a searchbar for this treeview
   * @vue-prop {string}  [searchbarPlaceholder] - Placeholder text for the searchbar, will be translated
   */
  export default {
    name: 'VcsTreeview',
    components: {
      VcsTreeviewLeaf,
      VcsTreeviewSearchbar,
      VTreeview,
    },
    props: {
      search: {
        type: String,
        default: '',
      },
      showSearchbar: {
        type: Boolean,
        default: false,
      },
      searchbarPlaceholder: {
        type: String,
        default: undefined,
      },
    },
    emits: ['update:search'],
    setup(props, { emit }) {
      const localSearchValue = useProxiedAtomicModel(props, 'search', emit);

      // TODO properly type the tree view item interface & export in index.d.ts

      const vm = getCurrentInstance().proxy;
      /**
       * @param {string} value
       * @param {string} q
       * @param {Object} item
       * @returns {number}
       */
      const handleFilter = (value, q, item) => {
        if (value == null || q == null) {
          return -1;
        }
        const translatedTitle = item.title ? vm.$st(item.title) : item.value;
        return translatedTitle
          .toLocaleLowerCase()
          .indexOf(q.toLocaleLowerCase());
      };

      return {
        localSearchValue,
        handleFilter,
      };
    },
  };
</script>
