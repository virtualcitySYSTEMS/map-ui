<template>
  <div>
    <TreeviewSearchbar
      v-if="hasSearchbar"
      :placeholder="searchbarPlaceholder"
      v-model="search"
    />
    <v-treeview
      class="vcs-treeview"
      :items="items"
      v-bind="{...$props, ...$attrs}"
      expand-icon="mdi-chevron-down"
      :class="{ 'top-level-checkbox-hidden': !topLevelSelectable }"
      on-icon="$vcsCheckboxChecked"
      off-icon="$vcsCheckbox"
      indeterminate-icon="$vcsCheckboxIndeterminate"
      :item-children="'items'"
      :search="search"
      @input="handleInput"
      :filter="handleFilter"
      @update:open="handleUpdateOpen"
    >
      <template v-slot:label="{ item }">
        <component
          v-for="component of availableComponents"
          :key="component"
          :is="component"
          :item="item"
          :selectable="selectable"
          @action-clicked="handleActionClicked"
        />
      </template>
    </v-treeview>
  </div>
</template>


<style lang="scss" scoped>

  .search-icon {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    left: 12px;
  }

  .update-badge {
    top: 50%;
    transform: translateY(-50%) translateX(8px);
  }

  ::v-deep {
    .v-application--is-ltr .v-treeview-node__content {
      margin-left: 0;
    }

    .v-treeview-node__root {
      position: relative;
    }

    .v-treeview-node__checkbox {
      position: absolute;
      right: 8px;
    }

    .v-treeview-node__prepend {
      min-width: 0;

      &:empty {
        display: none;
      }
    }
    // Hides Checkboxes from top-level
    .top-level-checkbox-hidden {
      .v-treeview-node__toggle + button.v-treeview-node__checkbox {
        display: none !important;
      }
    }

    .v-treeview-node__checkbox,
    .v-input--dense .v-input--selection-controls__input {
      height: 16px;
      width: 16px;
    }

    .v-list {
      padding: 4px 0;
    }

    .v-list-item {
      min-height: 28px;

      &:not(:last-child) {
        border-bottom: 1px solid var(--v-accent-base);
      }
    }
  }

  .vcs-treeview {
    ::v-deep {
      .v-treeview-node--disabled {
        .v-treeview-node__toggle {
          color: rgba(0, 0, 0, 0.38) !important;
        }
      }

      .v-treeview-node__label {
        white-space: pre-line;
        line-height: 1.2;
        overflow: unset;
        text-overflow: unset;
      }

      .v-treeview-node__root.v-treeview-node--active::before {
        opacity: 1 !important;
      }

      .v-input--selection-controls {
        margin-top: 0;
      }

      .v-input--selection-controls__input {
        margin-right: 0;
      }

      .v-icon.v-icon {
        justify-content: flex-start;
      }

      .v-treeview-node__root::before {
        width: 3px;
      }

      .v-treeview-node__append {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        align-items: center;

        .v-input__slot {
          margin: 0;
        }

        .v-input--selection-controls {
          margin-top: 0;
          padding-top: 0;
        }
      }

      .v-treeview-node__level {
        width: 12px;
      }

      > .v-treeview-node {
        > .v-treeview-node__root {
          border-bottom: 1px solid #dedede;

          > .v-treeview-node__content {
            font-weight: 700;
          }
        }

        > .v-treeview-node__children {
          .v-treeview-node__root {
            border-bottom: none;
          }

          .v-treeview-node__content {
            font-size: 12px;
            padding: 4px 0;
          }

          .v-treeview-node--leaf .v-treeview-node__root {
            min-height: 32px;
          }
        }
      }
    }
  }
</style>


<script>

  import TreeviewLeaf from '@vcsuite/uicomponents/TreeviewLeaf';
  import TreeviewSearchbar from '@vcsuite/uicomponents/TreeviewSearchbar.vue';
  import Vue from 'vue';
  import VueCompositionApi, { inject, ref } from '@vue/composition-api';

  Vue.component('TreeviewLeaf', TreeviewLeaf);
  Vue.use(VueCompositionApi);

  /**
   * @description extends API of https://vuetifyjs.com/en/api/v-treeview/
   * Can render dynamic components as leaf items.
   * In order to display an item needs to be registered and added to `availableComponents`.
   *
   * @vue-prop {Array}   items                - Treeview items
   * @vue-prop {boolean} hasSearchbar         - Whether there is a searchbar for this treeview
   * @vue-prop {string}  searchbarPlaceholder - Placeholder text for the searchbar
   * @vue-prop {boolean} topLevelSelectable   - Whether it should be possible to select branch roots
   * @vue-event {string} action-clicked       - When an action icon is clicked
   * @vue-event {string} menu-item-clicked    - When a menu item is clicked
   */
  export default Vue.extend({
    name: 'VcsTreeview',
    components: { TreeviewSearchbar },
    props: {
      items: {
        type: Array,
        default: () => ([]),
      },
      hasSearchbar: {
        type: Boolean,
        default: false,
      },
      searchbarPlaceholder: {
        type: String,
        default: undefined,
      },
      topLevelSelectable: {
        type: Boolean,
        default: false,
      },
      nameKey: {
        type: String,
        default: undefined,
      },
      selectable: {
        type: Boolean,
        default: false,
      },
    },
    setup(props, context) {
      const search = ref('');
      const availableComponents = ref(['TreeviewLeaf']);
      const language = inject('language');
      /**
       * @function
       * @param {Array<string | Object>} input
       * @returns {void}
       */
      const handleInput = input => context.emit('input', input);
      const handleActionClicked = input => context.emit('action-clicked', input);
      const handleUpdateOpen = openItems => context.emit('update:open', openItems);
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
        availableComponents,
        handleInput,
        handleActionClicked,
        handleUpdateOpen,
        handleFilter,
      };
    },
  });
</script>

