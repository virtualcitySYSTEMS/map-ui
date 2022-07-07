<template>
  <div>
    <VcsTreeview
      v-if="tree && tree.length"
      :items="tree"
      :has-searchbar="true"
    />
  </div>
</template>

<script>
  import { inject } from 'vue';
  import VcsTreeview from '../../components/lists/VcsTreeview.vue';

  /**
   * @description
   * uses a VcsTreeview and shows 'a components Window' based on the "categoryManager"
   * Uses the provided 'vcsApp'
   */
  export default {
    name: 'VcsComponentsManager',
    components: { VcsTreeview },
    setup() {
      const app = inject('vcsApp');
      return {
        tree: app.categoryManager.items,
      };
    },
  };
</script>
