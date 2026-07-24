<script setup lang="ts">
  import { computed, getCurrentInstance, watch } from 'vue';
  import type { PropType } from 'vue';
  import { VExpansionPanels } from 'vuetify/components';
  import {
    useProxiedAtomicModel,
    useProxiedComplexModel,
  } from '../modelHelper.js';
  import VcsTreeviewSearchbar from './VcsTreeviewSearchbar.ts.vue';
  import VcsExpansionPanel from '../section/VcsExpansionPanel.ts.vue';
  import VcsList from './VcsList.ts.vue';
  import { setupSelectableList } from './listHelper.js';
  import type { VcsListItem } from './VcsListItemComponent.ts.vue';
  import type { VcsAction } from '../../actions/actionHelper.js';

  export type VcsListGroup = {
    name: string;
    title?: string;
    disabled?: boolean;
    headerActions?: Array<VcsAction>;
    overflowCount?: number;
  };

  export type VcsGroupedListItem = VcsListItem & { group: string };

  /**
   * @description
   * The VcsGroupedList is intended to render items grouped by key.
   * Items not belonging to one of the provided groups are neglected.
   * Per group a sub list is rendered, which behaves just like a { @link VcsList }.
   * Only differences: The search and selection behaviour are cross group and items are not draggable.
   * @vue-prop {Array<import("./VcsListItemComponent.ts.vue").VcsListItem>} items
   * @vue-prop {boolean} [selectable=false]
   * @vue-prop {boolean} [singleSelect=false]
   * @vue-prop {Array<import("./VcsListItemComponent.ts.vue").VcsListItem>} [modelValue=[]] - the initial items to be selected.
   * @vue-prop {boolean} [searchable=false] - if this list can have its items searched.
   * @vue-prop {function(import("./VcsListItemComponent.ts.vue").VcsListItem, string):boolean} [customFilter] - a function to customize filtering when searching.
   * @vue-prop {string} [searchbarPlaceholder] - placeholder to render inside the search field
   */

  const props = defineProps({
    items: {
      type: Array as PropType<Array<VcsGroupedListItem>>,
      default: () => [],
    },
    groups: {
      type: Array as PropType<Array<VcsListGroup>>,
      default: () => [],
    },
    opened: {
      type: Array as PropType<Array<string>>,
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
      type: Array as PropType<Array<VcsGroupedListItem>>,
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
    searchbarPlaceholder: {
      type: String,
      default: undefined,
    },
    customFilter: {
      type: Function as PropType<
        (item: VcsGroupedListItem, search: string) => boolean
      >,
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

  const vm = getCurrentInstance()?.proxy;
  const localSearchValue = useProxiedAtomicModel(props, 'search', emit);
  const localOpenedGroups = useProxiedComplexModel(props, 'opened', emit);

  const translatedTitle = (item: VcsGroupedListItem): string =>
    item.title ? (vm?.$st(item.title) as string) : item.name;

  const filterPredicate = (
    item: VcsGroupedListItem,
    queryString = '',
  ): boolean => {
    if (props.customFilter) {
      return props.customFilter(item, queryString);
    }
    return translatedTitle(item)
      .toLocaleLowerCase()
      .includes(queryString.toLocaleLowerCase());
  };

  function sortByGroupOrder(
    items: VcsGroupedListItem[],
    groups: VcsListGroup[],
  ): VcsGroupedListItem[] {
    const groupOrder = new Map(groups.map((g, index) => [g.name, index]));

    return items.sort(
      (a, b) => (groupOrder.get(a.group) ?? 0) - (groupOrder.get(b.group) ?? 0),
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
    [(): VcsListGroup[] => props.groups, (): boolean => props.openAll],
    () => {
      if (props.openAll) {
        localOpenedGroups.value = [...props.groups.map((group) => group.name)];
      }
    },
    { immediate: true },
  );
</script>

<template>
  <div class="vcs-grouped-list">
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
      <VcsExpansionPanel
        v-for="(group, i) in groups"
        :data-group-name="group.name"
        :key="i"
        :value="group.name"
        :disabled="group.disabled"
        :heading="group.title ?? group.name"
        :header-actions="group.headerActions"
        :action-button-list-overflow-count="group.overflowCount"
      >
        <VcsList
          :items="renderingItems.filter((s) => s.group === group.name)"
          :selectable="selectable"
          :single-select="singleSelect"
          :select-function="select"
          :model-value="
            selected.filter(
              (s) => (s as VcsGroupedListItem).group === group.name,
            )
          "
        />
      </VcsExpansionPanel>
    </v-expansion-panels>
  </div>
</template>

<style scoped lang="scss">
  .panels .vcs-expansion-panel:not(:last-child) {
    border-bottom: 1px solid rgb(var(--v-theme-base-lighten-2));
  }
  :deep(.v-list-item-title) > span {
    font-weight: bold;
  }
</style>
