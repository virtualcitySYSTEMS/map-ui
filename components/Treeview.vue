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
      item-key="id"
      :class="{ 'top-level-checkbox-hidden': !topLevelSelectable }"
      on-icon="$vcsCheckboxChecked"
      off-icon="$vcsCheckbox"
      indeterminate-icon="$vcsCheckboxIndeterminate"
      :search="search"
    >
      <template v-slot:prepend="{ item }">
        <v-icon
          v-if="item.iconPrepend"
          v-text="item.iconPrepend.name"
          :size="item.iconPrepend.size || 16"
        />
      </template>

      <template v-slot:label="{item}">
        <span>{{ item.name }}</span>
        <Badge
          v-if="item.hasUpdate"
          class="update-badge position-absolute"
        />
      </template>

      <template v-slot:append="{ item }">
        <v-icon
          v-for="action of item.actions"
          :key="action.title"
          size="16"
          @click="() => onIconButtonClick(action.title)"
          class="mr-2"
          v-text="action.icon"
        />
        <v-checkbox
          indeterminate
          :ripple="false"
          hide-details
          dense
          v-if="item.selectable"
          on-icon="$vcsCheckboxChecked"
          off-icon="$vcsCheckbox"
          indeterminate-icon="$vcsCheckboxIndeterminate"
        />

        <v-menu
          right
          v-if="item.menuItems"
          :close-on-content-click="true"
        >
          <template v-slot:activator="{ on, attrs }">
            <v-icon
              v-text="'mdi-dots-vertical'"
              v-bind="attrs"
              v-on="on"
              size="16"
            />
          </template>

          <v-list>
            <v-list-item
              v-for="(menuItem, index) in item.menuItems"
              :key="index"
              @click="() => onMenuItemClick(menuItem)"
            >
              <v-icon
                v-if="menuItem.icon"
                v-text="menuItem.icon"
                size="16"
                class="mr-2"
              />
              <v-list-item-title>{{ menuItem.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
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
        // white-space: normal;
      }

      .v-treeview-node__root.v-treeview-node--active::before{
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
          border-bottom: 1px solid #DEDEDE;

          > .v-treeview-node__content {
            font-weight: 700;
          }
        }

        > .v-treeview-node__children {

          .v-treeview-node__root {
            border-bottom: none
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

  import Badge from '@vcsuite/uicomponents/Badge.vue';
  import TreeviewSearchbar from '@vcsuite/uicomponents/TreeviewSearchbar.vue';
  import Vue from 'vue';

  /**
   * @description extends API of https://vuetifyjs.com/en/api/v-treeview/
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
    data() {
      return { search: '' };
    },
    components: { TreeviewSearchbar, Badge },
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
    },
    methods: {
      onIconButtonClick(action) {
        this.$emit('action-clicked', action);
      },
      onMenuItemClick(menuItem) {
        this.$emit('menu-item-clicked', menuItem);
      },
    },
  });
</script>

