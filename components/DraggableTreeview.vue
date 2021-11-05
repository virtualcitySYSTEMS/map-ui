<template>
  <VuetifyDraggableTreeview
    class="vcs-treeview vcs-treeview-draggable"
    v-model="localItems"
    expand-icon="mdi-chevron-down"
    v-bind="{...$props, ...$attrs}"
  >
    <template #label="{ item }">
      <span>{{ item.name }}</span>
    </template>
  </VuetifyDraggableTreeview>
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
    .v-treeview-node__prepend:empty {
      display: none;
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

          .v-treeview-node__label {
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
  import 'sortablejs/Sortable.min';

  import Vue from 'vue';
  import VuetifyDraggableTreeview from 'vuetify-draggable-treeview';

  /**
   * @description
   * Extends https://github.com/suusan2go/vuetify-draggable-treeview
   */
  export default Vue.extend({
    name: 'VcsDraggableTreeview',
    components: {
      VuetifyDraggableTreeview,
    },
    props: {
      items: {
        type: Array,
        default: () => ([]),
      },
    },
    setup(props) {
      return {
        localItems: [...props.items],
      };
    },
  });
</script>
