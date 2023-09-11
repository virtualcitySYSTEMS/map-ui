<template>
  <v-container class="pa-0">
    <v-expansion-panels
      accordion
      multiple
      v-if="componentIds.length > 0"
      v-model="panels"
      class="rounded-0"
    >
      <collection-component-provider
        v-for="componentId in componentIds"
        :component-id="componentId"
        :key="componentId"
      />
    </v-expansion-panels>
  </v-container>
</template>

<script>
  import { computed, inject, ref } from 'vue';
  import { VExpansionPanels, VContainer } from 'vuetify/lib';
  import CollectionComponentProvider from './CollectionComponentProvider.vue';

  /**
   * @description Renders the all managed CollectionComponents of a CollectionManager.
   * The collectionManager must be passed via {@link https://vuejs.org/api/composition-api-dependency-injection.html |provide }.
   */
  export default {
    name: 'CollectionManager',
    components: {
      VExpansionPanels,
      VContainer,
      CollectionComponentProvider,
    },
    setup() {
      const collectionManager = inject('collectionManager');
      const componentIds = ref(collectionManager.componentIds);

      /**
       * @type {WritableComputedRef<number[]>}
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
      };
    },
  };
</script>
