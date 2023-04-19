<template>
  <div class="d-contents">
    <VcsTreeviewSearchbar
      v-if="showSearchbar"
      :placeholder="searchbarPlaceholder"
      v-model="search"
    />
    <v-treeview
      class="vcs-treeview"
      v-bind="{ ...$props, ...$attrs }"
      v-on="$listeners"
      expand-icon="mdi-chevron-down"
      item-key="name"
      :search="search"
      :filter="handleFilter"
    >
      <template #label="{ item }">
        <VcsTreeviewLeaf
          :item="item"
          :class="[item.clickable ? 'cursor-pointer' : '']"
          @click.native="item.clickable && item.clicked($event)"
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
      > .v-treeview-node:not(:last-child) {
        border-bottom: 1px solid var(--v-base-lighten2);
      }
      // Only Root Entries have a bold font
      > .v-treeview-node
        > .v-treeview-node__root
        > .v-treeview-node__content
        > .v-treeview-node__label {
        font-weight: 700;
      }
      // remove ripple effect from expand icon
      .v-icon.v-icon {
        &::after {
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
  import { getCurrentInstance, ref } from 'vue';
  import { VTreeview } from 'vuetify/lib';
  import VcsTreeviewLeaf from './VcsTreeviewLeaf.vue';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.vue';

  /**
   * @description extends API of https://vuetifyjs.com/en/api/v-treeview/
   * Can render dynamic components as leaf items.
   * In order to display an item needs to be registered and added to `availableComponents`.
   * @vue-prop {boolean} [showSearchbar=false] - Whether there is a searchbar for this treeview
   * @vue-prop {string}  [searchbarPlaceholder] - Placeholder text for the searchbar, will be translated
   */
  export default {
    name: 'VcsTreeview',
    components: {
      VcsTreeviewSearchbar,
      VcsTreeviewLeaf,
      VTreeview,
    },
    props: {
      showSearchbar: {
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
      // TODO properly type the tree view item interface & export in index.d.ts

      const vm = getCurrentInstance().proxy;
      /**
       * @param {{ title: string }} treeNode
       * @param {string} q
       * @returns {boolean}
       */
      const handleFilter = (treeNode, q = '') => {
        const translatedTitle = vm.$t(treeNode.title);
        return translatedTitle
          .toLocaleLowerCase()
          .includes(q.toLocaleLowerCase());
      };

      return {
        search,
        handleFilter,
      };
    },
  };
</script>
