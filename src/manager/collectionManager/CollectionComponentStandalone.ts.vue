<script setup lang="ts">
  import { computed, getCurrentInstance, inject, ref } from 'vue';
  import { createSelectionActions } from '../../components/lists/listHelper.js';
  import VcsFormSection from '../../components/section/VcsFormSection.ts.vue';
  import CollectionComponentList from './CollectionComponentList.ts.vue';
  import CollectionComponentContent from './CollectionComponentContent.ts.vue';
  import type CollectionComponentClass from './collectionComponentClass.js';

  /**
   * @description
   * Renders the first ten items of a collectionComponent in a List. Uses CollectionComponentList to render more items.
   * The collectionComponent must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   */
  const emit = defineEmits<{
    (e: 'update:modelValue' | 'open-list' | 'close-list'): void;
  }>();

  const vm = getCurrentInstance()?.proxy;
  const collectionComponent = inject(
    'collectionComponent',
  ) as CollectionComponentClass;
  const componentListView = ref(false);

  const selectionActions = createSelectionActions(
    collectionComponent.items,
    collectionComponent.selection,
    emit,
  );

  const collectionComponentActions = collectionComponent.getActions();

  const title = computed(() => {
    if (
      collectionComponent.selectable &&
      collectionComponent.selection.value.length > 0
    ) {
      return `${vm?.$st(collectionComponent.title.value)} (${
        collectionComponent.selection.value.length
      })`;
    }
    return collectionComponent.title.value;
  });

  const actions = computed(() => {
    if (
      collectionComponent.selectable.value &&
      !collectionComponent.singleSelect.value
    ) {
      return [...selectionActions, ...collectionComponentActions.value];
    }
    return collectionComponentActions.value;
  });

  function openList(): void {
    componentListView.value = true;
  }
  function closeList(): void {
    componentListView.value = false;
  }
</script>

<template>
  <VcsFormSection
    :heading="title"
    :header-actions="actions"
    :action-button-list-overflow-count="collectionComponent.overflowCount.value"
    v-bind="{ ...$attrs }"
    class="collection-component-standalone"
  >
    <CollectionComponentList
      v-if="componentListView"
      hide-header
      @close-list="closeList"
    />
    <CollectionComponentContent v-else @open-list="openList" />
  </VcsFormSection>
</template>

<style lang="scss" scoped></style>
