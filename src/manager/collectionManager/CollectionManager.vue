<template>
  <v-container class="pa-0">
    <v-expansion-panels
      accordion
      multiple
      v-if="componentIds.length > 0"
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
  import { inject, ref } from 'vue';
  import { VExpansionPanels, VContainer } from 'vuetify/lib';
  import CollectionComponentProvider from './CollectionComponentProvider.vue';

  /**
   * Renders the all managed CollectionComponents of a CollectionManager.
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

      return {
        componentIds,
      };
    },
  };
</script>
