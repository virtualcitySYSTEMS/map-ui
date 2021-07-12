<template>
  <DraggableWindow
    @close="close"
    :draggable-window="draggableWindow"
    :z-index="zIndex"
    :z-index-max="zIndexMax"
  >
    <Treeview
      v-if="tree && tree.items"
      :items="tree.items"
      :has-searchbar="true"
      :searchbar-placeholder="'layer-tree.search.placeholder'"
      selectable
      @input="handleInput"
      @action-clicked="handlePopover"
      @update:open="handleUpdateOpen"
    />
  </DraggableWindow>
</template>


<script>
  import Vue from 'vue';
  import VueCompositionAPI, {
    defineComponent,
    inject,
    ref,
    onMounted,
    provide,
    nextTick,
  } from '@vue/composition-api';

  import Treeview from '@vcsuite/uicomponents/Treeview.vue';
  import DraggableWindow from '@/modules/draggable-window/DraggableWindow.vue';
  import AbstractTree from '@/treeview/AbstractTree';
  import createTreeFromConfig from '@/treeview/createTreeFromConfig';


  Vue.use(VueCompositionAPI);

  let treeInstance;
  async function getTree(context) {
    if (!treeInstance) {
      // eslint-disable-next-line no-console
      console.log(context.config.widgets.find(w => w.type === 'vcs.vcm.widgets.legend.Legend'));
      treeInstance = await createTreeFromConfig(
        context,
        context.config.widgets.find(w => w.type === 'vcs.vcm.widgets.legend.Legend').items,
        AbstractTree,
      );
    }
    return treeInstance;
  }

  /**
   * @description
   * Implements Treeview and shows 'vcs.vcm.widgets.legend.Legend'
   */
  export default defineComponent({
    name: 'VcsLayerTree',
    components: { Treeview, DraggableWindow },
    setup() {
      const tree = ref();
      const context = inject('context');
      const popoverManager = inject('popoverManager');
      const draggableWindowManager = inject('draggableWindowManager');
      const selectedIds = ref([]);
      const { zIndexMax, zIndexMap } = draggableWindowManager.state;
      const draggableWindow = draggableWindowManager.get('layer-tree');
      const zIndex = zIndexMap['layer-tree'];
      provide('tree', tree);

      onMounted(async () => {
        tree.value = await getTree(context);
      });


      /**
       * @param {Array<string>} value
       */
      const handleInput = (value) => {
        selectedIds.value = value;
      };

      /**
       * @function
       * @param {Object} obj Destructured argument
       * @param {AbstractTreeNode} obj.item The object that has been clicked
       * @param {Event} obj.event The click event
       * @description Callback from Treeview which invokes an overlay to be shown.
       */
      const handlePopover = async ({ item, event }) => {
        const id = item.layerName;
        if (popoverManager.removePopover(id)) {
          return;
        }

        const componentName = 'Legend';
        // To resolve this path we must import here instead of popoverManager.
        const cmp = await import(`@vcsuite/uicomponents/${componentName}.vue`);

        const callback = () => popoverManager.removePopover(id);
        popoverManager.registerPopover({
          name: componentName,
          cmp,
          id,
          element: event.target,
          callback,
        });
      };


      /**
       * @function
       * @description
       * Hides the popovers which are open at the moment.
       */
      const handleUpdateOpen = () => {
        nextTick(() => popoverManager.removeOrphaned());
      };

      /**
       * @param {string} viewId
       */
      const close = (viewId) => {
        draggableWindowManager.remove(viewId);
      };

      return {
        tree,
        selectedIds: [],
        handleInput,
        handlePopover,
        handleUpdateOpen,
        close,
        zIndexMax,
        draggableWindow,
        zIndex,
      };
    },
  });
</script>
