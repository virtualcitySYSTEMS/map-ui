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
      @click:select="itemClicked($event.id, $event.event)"
    >
      <template #title="scope">
        <slot name="title" v-bind="scope ?? {}">
          <VcsTreeviewTitle :item="scope.item"></VcsTreeviewTitle>
        </slot>
      </template>
      <template v-for="slot of forwardSlots" #[slot]="scope">
        <slot :name="slot" v-bind="scope ?? {}" />
      </template>
      <template #prepend="scope">
        <slot name="prepend" v-bind="scope ?? {}">
          <template v-if="scope.item?.icon">
            <v-icon
              v-if="typeof scope.item?.icon === 'string'"
              :size="iconSize"
            >
              {{ scope.item.icon }}
            </v-icon>
            <ImageElementInjector :element="scope.item.icon" v-else />
          </template>
        </slot>
      </template>
      <template #append="scope">
        <slot name="append" v-bind="scope ?? {}">
          <VcsActionButtonList
            v-if="scope.item.actions?.length > 0"
            :actions="scope.item.actions"
            :overflow-count="3"
            :disabled="scope.item.disabled"
            right
            tooltip-position="right"
            block-overflow
            class="col-4 pa-0 d-flex align-center"
          />
        </slot>
      </template>
    </v-treeview>
  </div>
</template>
<style lang="scss" scoped>
  :deep(.vcs-treeview) {
    // Root Level Entries should be 40px high
    > .v-list-item,
    > .v-list-group > .v-list-item {
      min-height: calc(var(--v-vcs-font-size) * 2 + 14px) !important;
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
  import { VIcon } from 'vuetify/components';
  import { VTreeview } from 'vuetify/labs/VTreeview';
  import { useProxiedAtomicModel } from '../modelHelper.js';
  import { useForwardSlots } from '../composables.js';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.vue';
  import VcsActionButtonList from '../buttons/VcsActionButtonList.vue';
  import ImageElementInjector from '../ImageElementInjector.vue';
  import VcsTreeviewTitle from './VcsTreeviewTitle.vue';
  import { useIconSize } from '../../vuePlugins/vuetify.js';

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
      VcsTreeviewTitle,
      VIcon,
      ImageElementInjector,
      VcsActionButtonList,
      VcsTreeviewSearchbar,
      VTreeview,
    },
    props: {
      items: {
        type: Array,
        default: () => [],
      },
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
    setup(props, { emit, slots }) {
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

      const forwardSlots = useForwardSlots(slots, [
        'append',
        'title',
        'prepend',
      ]);
      const iconSize = useIconSize();
      return {
        iconSize,
        localSearchValue,
        handleFilter,
        forwardSlots,
        itemClicked(name, event) {
          const items = props.items.slice();
          let item;
          while (items.length > 0) {
            item = items.pop();
            if (item.name === name) {
              break;
            }
            if (item.children?.length > 0) {
              items.push(...item.children);
            }
          }

          if (item?.clicked && !item?.disabled) {
            item.clicked(event);
          }
        },
      };
    },
  };
</script>
