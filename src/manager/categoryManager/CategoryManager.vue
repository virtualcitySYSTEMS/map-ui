<template>
  <div
    v-if="categories.length > 0"
  >
    <category-component
      v-for="category in categories"
      :category="category"
      :key="category.categoryName"
    />
  </div>
</template>

<script>
  import { inject, ref, computed } from 'vue';
  import CategoryComponent from './CategoryComponent.vue';

  /**
   * @description
   * uses a VcsList and renders 'a components Window' based on the "categoryManager"
   * Uses the provided 'vcsApp'
   */
  export default {
    name: 'CategoryManager',
    components: { CategoryComponent },
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
