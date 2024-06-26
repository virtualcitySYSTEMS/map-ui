<template>
  <v-container class="pa-0">
    <v-expansion-panels
      accordion
      multiple
      v-if="!componentView && componentIds.length > 0"
      v-model="panels"
      class="rounded-0"
    >
      <collection-component-provider
        v-for="componentId in componentIds"
        :component-id="componentId"
        :key="componentId"
      >
        <collection-component @openList="openList" />
      </collection-component-provider>
    </v-expansion-panels>
    <collection-component-provider
      v-if="componentView"
      :component-id="componentView"
    >
      <collection-component-list @closeList="closeList" />
    </collection-component-provider>
  </v-container>
</template>

<script>
  import { computed, inject, ref } from 'vue';
  import { VExpansionPanels, VContainer } from 'vuetify/lib';
  import CollectionComponentProvider from './CollectionComponentProvider.vue';
  import CollectionComponentList from './CollectionComponentList.vue';
  import CollectionComponent from './CollectionComponent.vue';

  /**
   * @description Renders the all managed CollectionComponents of a CollectionManager.
   * The collectionManager must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   */
  export default {
    name: 'CollectionManager',
    components: {
      CollectionComponentList,
      VExpansionPanels,
      VContainer,
      CollectionComponentProvider,
      CollectionComponent,
    },
    setup() {
      /**
       * @type {import("./collectionManager.js").CollectionManager}
       */
      const collectionManager = inject('collectionManager');
      const componentIds = ref(collectionManager.componentIds);
      /**
       * @type {import("vue").Ref<string|null>}
       */
      const componentView = ref(null);
      /**
       * @type {import("vue").WritableComputedRef<number[]>}
       */
      const panels = computed({
        get() {
          return [...Array(componentIds.value.length).keys()].filter(
            (p, idx) =>
              !!collectionManager.get(componentIds.value[idx]).open.value,
          );
        },
        set(value) {
          componentIds.value.forEach((id, idx) => {
            collectionManager.get(id).open.value = value.includes(idx);
          });
        },
      });

      return {
        componentIds,
        panels,
        componentView,
        openList(id) {
          componentView.value = id;
        },
        closeList() {
          componentView.value = null;
        },
      };
    },
  };
</script>
