<template>
  <div @click.stop="close" class="context-menu-component">
    <VcsActionList :actions="actions" :show-icon="true" />
  </div>
</template>

<script lang="ts">
  import { defineComponent, inject } from 'vue';
  import type { PropType } from 'vue';
  import type VcsUiApp from '../../vcsUiApp.js';
  import type { VcsAction } from '../../actions/actionHelper.js';
  import VcsActionList from '../../components/lists/VcsActionList.ts.vue';

  export const contextMenuWindowId = 'contextMenuWindow';

  /**
   * @description Renders a list of actions as modal window.
   * @vue-prop {Array<VcsAction>} actions
   */
  export default defineComponent({
    name: 'ContextMenuComponent',
    components: { VcsActionList },
    props: {
      actions: {
        type: Array as PropType<Array<VcsAction>>,
        required: true,
      },
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;

      const close = (): void => {
        app.windowManager.remove(contextMenuWindowId);
      };

      return {
        close,
      };
    },
  });
</script>

<style scoped></style>
