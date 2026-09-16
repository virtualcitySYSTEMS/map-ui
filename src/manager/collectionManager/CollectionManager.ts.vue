<script setup lang="ts">
  import { computed, inject, onUnmounted, ref } from 'vue';
  import { VExpansionPanels, VContainer } from 'vuetify/components';
  import CollectionComponentProvider from './CollectionComponentProvider.ts.vue';
  import CollectionComponentList from './CollectionComponentList.ts.vue';
  import CollectionComponent from './CollectionComponent.ts.vue';
  import type CollectionManager from './collectionManager.js';

  /**
   * @description Renders the all managed CollectionComponents of a CollectionManager.
   * The collectionManager must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   */

  const collectionManager = inject('collectionManager') as CollectionManager;
  const { componentIds } = collectionManager;
  const componentView = ref<string | null>(null);

  const removedListener = collectionManager.removed.addEventListener(
    (collectionComponent) => {
      if (componentView.value === collectionComponent.id) {
        componentView.value = null;
      }
    },
  );

  onUnmounted(() => {
    removedListener();
  });

  const panels = computed<number[]>({
    get() {
      return [...Array(componentIds.length).keys()].filter(
        (_p, idx) => !!collectionManager.get(componentIds[idx])?.open.value,
      );
    },
    set(value) {
      componentIds.forEach((id, idx) => {
        if (collectionManager.has(id)) {
          collectionManager.get(id)!.open.value = value.includes(idx);
        }
      });
    },
  });

  function openList(id: string): void {
    componentView.value = id;
  }
  function closeList(): void {
    componentView.value = null;
  }
</script>

<template>
  <v-container class="pa-0 collection-manager">
    <v-expansion-panels
      v-if="!componentView && componentIds.length > 0"
      variant="accordion"
      multiple
      v-model="panels"
      class="rounded-0"
    >
      <CollectionComponentProvider
        v-for="(componentId, index) in componentIds"
        :component-id="componentId"
        :key="componentId"
      >
        <CollectionComponent
          @open-list="openList"
          :open="panels.includes(index)"
        />
      </CollectionComponentProvider>
    </v-expansion-panels>
    <CollectionComponentProvider
      v-if="componentView"
      :component-id="componentView"
    >
      <CollectionComponentList @close-list="closeList" />
    </CollectionComponentProvider>
  </v-container>
</template>
