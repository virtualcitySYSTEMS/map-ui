<template>
  <div @click.stop="close" class="context-menu-component">
    <VcsActionList :actions="actions" :show-icon="true" />
  </div>
</template>

<script>
  import { inject } from 'vue';
  import VcsActionList from '../../components/lists/VcsActionList.vue';

  /**
   * @type {string}
   */
  export const contextMenuWindowId = 'contextMenuWindow';

  /**
   * @description Renders a list of actions as modal window.
   * @vue-prop {Array<VcsAction>} actions
   */
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

<style scoped></style>
