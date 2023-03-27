<template>
  <v-sheet>
    <v-expansion-panels
      accordion
      multiple
      v-if="categories.length > 0"
      class="rounded-0"
    >
      <category-component
        v-for="category in categories"
        :category="category"
        :key="category.categoryName"
      />
    </v-expansion-panels>
  </v-sheet>
</template>

<script>
  import { inject, ref, computed } from 'vue';
  import {
    VExpansionPanels,
    VSheet,
  } from 'vuetify/lib';
  import CategoryComponent from './CategoryComponent.vue';

  /**
   * @description
   * uses a VcsList and renders 'a components Window' based on the "categoryManager"
   * Uses the provided 'vcsApp'
   */
  export default {
    name: 'CategoryManager',
    components: {
      VExpansionPanels,
      VSheet,
      CategoryComponent,
    },
    setup() {
      const app = inject('vcsApp');
      const categoryIds = ref(app.categoryManager.componentIds);
      const categories = computed(() => categoryIds.value.map(id => app.categoryManager.get(id)));

      return {
        categories,
      };
    },
  };
</script>
