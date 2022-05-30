<template>
  <div class="d-contents">
    <VcsTreeviewSearchbar
      v-if="hasSearchbar"
      :placeholder="searchbarPlaceholder"
      v-model="search"
    />
    <v-treeview
      class="vcs-treeview"
      v-bind="{...$props, ...$attrs}"
      v-on="$listeners"
      expand-icon="mdi-chevron-down"
      item-key="name"
      :search="search"
      :filter="handleFilter"
      :activatable="false"
    >
      <template #label="{ item }">
        <VcsTreeviewLeaf
          :item="item"
          :class="[item.clickable ? 'cursor-pointer' : '']"
          @click.native="item.clickable && item.clicked()"
        />
      </template>
    </v-treeview>
  </div>
</template>
<style lang="scss" scoped>
.vcs-treeview {
  ::v-deep {
    // Root Level Entries should be 40px high
    > .v-treeview-node > .v-treeview-node__root {
      min-height: 40px;
    }
    // Border around root nodes with children included
    > .v-treeview-node {
      border-bottom: 1px solid var(--v-gray-200-base);
    }
    // Only Root Entries have a bold font
    > .v-treeview-node > .v-treeview-node__root > .v-treeview-node__content > .v-treeview-node__label {
      font-weight: 700;
    }
    // remove ripple effect from expand icon
    .v-icon.v-icon {
      &::after{
        background-color: transparent;
      }
    }
    // Toggle Item Chevron with should be 16px
    .v-treeview-node__toggle {
      width: 16px;
    }
  }
}
</style>

<script>
  import { inject, ref } from '@vue/composition-api';
  import VcsTreeviewLeaf from './VcsTreeviewLeaf.vue';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.vue';

  /**
   * @description extends API of https://vuetifyjs.com/en/api/v-treeview/
   * Can render dynamic components as leaf items.
   * In order to display an item needs to be registered and added to `availableComponents`.
   * @vue-prop {boolean} [hasSearchbar=false] - Whether there is a searchbar for this treeview
   * @vue-prop {string}  [searchbarPlaceholder] - Placeholder text for the searchbar
   */
  export default {
    name: 'VcsTreeview',
    components: { VcsTreeviewSearchbar, VcsTreeviewLeaf },
    props: {
      hasSearchbar: {
        type: Boolean,
        default: false,
      },
      searchbarPlaceholder: {
        type: String,
        default: undefined,
      },
    },
    setup() {
      const search = ref('');
      const language = inject('language');
      // TODO properly type the tree view item interface & export in index.d.ts
      /**
       * @param {{ title: string }} treeNode
       * @param {string} q
       * @returns {boolean}
       */
      const handleFilter = (treeNode, q = '') => {
        if (typeof treeNode.title === 'string') {
          return treeNode.title.toLocaleLowerCase().includes(q.toLocaleLowerCase());
        }
        if (typeof treeNode.title === 'object') {
          const title = (treeNode.title[language] || treeNode.title.en || treeNode.title.de || 'NO LABEL FOUND');
          return title.toLocaleLowerCase().includes(q.toLocaleLowerCase());
        }
        return false;
      };

      return {
        search,
        handleFilter,
      };
    },
  };
</script>

