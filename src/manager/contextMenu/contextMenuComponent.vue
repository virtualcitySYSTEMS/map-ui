<template>
  <div @click.stop="close">
    <VcsActionList
      :actions="actions"
      :show-icon="true"
    />
  </div>
</template>

<script>
  import { inject } from '@vue/composition-api';
  import VcsActionList from '../../components/lists/VcsActionList.vue';

  /**
   * @type {string}
   */
  export const contextMenuWindowId = 'contextMenuWindow';

  export default {
    name: 'ContextMenuComponent',
    components: { VcsActionList },
    props: {
      actions: {
        type: Array,
        required: true,
      },
    },
    setup() {
      const app = inject('vcsApp');

      const close = () => {
        app.windowManager.remove(contextMenuWindowId);
      };

      return {
        close,
      };
    },
  };
</script>

<style scoped>
</style>
