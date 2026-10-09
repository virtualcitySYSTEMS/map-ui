<script setup>
  import { computed, getCurrentInstance, watch } from 'vue';
  import { VExpansionPanels } from 'vuetify/components';
  import {
    useProxiedAtomicModel,
    useProxiedComplexModel,
  } from '../modelHelper.js';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.vue';
  import VcsExpansionPanel from '../section/VcsExpansionPanel.vue';
  import VcsList from './VcsList.vue';
  import { setupSelectableList } from './listHelper.js';

  /**
   * @typedef {Object} VcsListGroup
   * @property {string} name
   * @property {string?} title
   * @property {boolean?} disabled
   * @property {Array<import("../../actions/actionHelper.js").VcsAction>?} headerActions
   * @property {number?} overflowCount
   */

  /**
   * @typedef {import("./VcsListItemComponent.vue").VcsListItem & { group: string }} VcsGroupedListItem
   * @property {string} group
   */

  /**
   * @description
   * The VcsGroupedList is intended to render items grouped by key.
   * Items not belonging to one of the provided groups are neglected.
   * Per group a sub list is rendered, which behaves just like a { @link VcsList }.
   * Only differences: The search and selection behaviour are cross group and items are not draggable.
   * @vue-prop {Array<import("./VcsListItemComponent.vue").VcsListItem>} items
   * @vue-prop {boolean} [selectable=false]
   * @vue-prop {boolean} [singleSelect=false]
   * @vue-prop {Array<import("./VcsListItemComponent.vue").VcsListItem>} [modelValue=[]] - the initial items to be selected.
   * @vue-prop {boolean} [searchable=false] - if this list can have its items searched.
   * @vue-prop {boolean} [stickySearchbar=false] - Keeps the searchbar at the top of the scroll container.
   * @vue-prop {function(import("./VcsListItemComponent.vue").VcsListItem, string):boolean} [customFilter] - a function to customize filtering when searching.
   * @vue-prop {string} [searchbarPlaceholder] - placeholder to render inside the search field
   */

  const props = defineProps({
    /** @type {VcsGroupedListItem} */
    items: {
      type: Array,
      default: () => [],
    },
    groups: {
      type: Array,
      default: () => [],
    },
    opened: {
      type: Array,
      default: () => [],
    },
    selectable: {
      type: Boolean,
      default: false,
    },
    singleSelect: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Array,
      default: () => [],
    },
    search: {
      type: String,
      default: '',
    },
    searchable: {
      type: Boolean,
      default: false,
    },
    stickySearchbar: {
      type: Boolean,
      default: false,
    },
    searchbarPlaceholder: {
      type: String,
      default: undefined,
    },
    customFilter: {
      type: Function,
      default: undefined,
    },
    openAll: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits([
    'update:modelValue',
    'update:search',
    'update:opened',
  ]);

  const vm = getCurrentInstance().proxy;
  const localSearchValue = useProxiedAtomicModel(props, 'search', emit);
  const localOpenedGroups = useProxiedComplexModel(props, 'opened', emit);

  const translatedTitle = (item) =>
    item.title ? vm.$t(item.title) : item.name;

  /** @type {function(import("./VcsListItemComponent.vue").VcsListItem, string):boolean} */
  const filterPredicate = (item, queryString = '') => {
    if (props.customFilter) {
      return props.customFilter(item, queryString);
    }
    return translatedTitle(item)
      .toLocaleLowerCase()
      .includes(queryString.toLocaleLowerCase());
  };

  function sortByGroupOrder(items, groups) {
    const groupOrder = new Map(groups.map((g, index) => [g.name, index]));

    return items.sort(
      (a, b) => groupOrder.get(a.group) - groupOrder.get(b.group),
    );
  }

  const renderingItems = computed(() => {
    let { items } = props;
    if (localSearchValue.value) {
      items = items.filter((i) => filterPredicate(i, localSearchValue.value));
    }
    return sortByGroupOrder(items, props.groups);
  });

  const { select, selected } = setupSelectableList(props, renderingItems, emit);

  watch(
    [() => props.groups, () => props.openAll],
    () => {
      if (props.openAll) {
        localOpenedGroups.value = [...props.groups.map((group) => group.name)];
      }
    },
    {
      immediate: true,
    },
  );
</script>

<template>
  <div
    class="vcs-grouped-list"
    :class="{ 'sticky-searchbar': stickySearchbar && searchable }"
  >
    <VcsTreeviewSearchbar
      v-if="searchable"
      :placeholder="searchbarPlaceholder"
      v-model="localSearchValue"
    />
    <v-expansion-panels
      variant="accordion"
      flat
      multiple
      v-model="localOpenedGroups"
      class="rounded-0 panels"
    >
      <vcs-expansion-panel
        v-for="(group, i) in groups"
        :data-group-name="group.name"
        :key="i"
        :value="group.name"
        :disabled="group.disabled"
        :heading="group.title ?? group.name"
        :header-actions="group.headerActions"
        :action-button-list-overflow-count="group.overflowCount"
      >
        <vcs-list
          :items="renderingItems.filter((s) => s.group === group.name)"
          :selectable="selectable"
          :single-select="singleSelect"
          :select-function="select"
          :model-value="selected.filter((s) => s.group === group.name)"
        />
      </vcs-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style scoped lang="scss">
  .vcs-grouped-list {
    display: block;
    flex: 1 1 auto;
    min-height: 0;
    overflow: auto;
    scrollbar-gutter: stable;
  }

  .vcs-grouped-list.sticky-searchbar {
    --searchbar-height: calc(var(--v-vcs-font-size) * 2 + 18px);
    margin-top: var(--searchbar-height);

    > .vcs-treeview-searchbar {
      width: 100%;
      position: absolute !important;
      margin-top: calc(var(--searchbar-height) * -1);
      z-index: 2;
    }
  }

  .panels .vcs-expansion-panel:not(:last-child) {
    border-bottom: 1px solid rgb(var(--v-theme-base-lighten-2));
  }
  :deep(.v-list-item-title) > span {
    font-weight: bold;
  }
</style>
