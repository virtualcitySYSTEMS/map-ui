<template>
  <DraggableWindow
    :view-id="draggableWindow.id"
    :z-index="draggableWindow.zIndex"
    @draggable-window-dropped="handleDraggableWindowDropped"
    @draggable-window-closed="toggleViewVisible"
    :x="900"
    :y="100"
    :icon="'$vcsLayers'"
    :header="'layer-tree.title' | translate"
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
  import DraggableWindowId from '@/modules/draggable-window/draggable-window-id';
  import { bringViewToTop, toggleViewVisible } from '@/modules/draggable-window/draggable-window.mutations';
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
      const draggableWindowState = inject('draggableWindowState');
      const selectedIds = ref([]);
      const draggableWindow = draggableWindowState.draggableWindows[DraggableWindowId.LayerTree];
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

      return {
        tree,
        selectedIds: [],
        DraggableWindowId,
        draggableWindow,
        handleInput,
        toggleViewVisible: id => toggleViewVisible(draggableWindowState, id),
        handleDraggableWindowDropped: (id) => {
          nextTick(() => popoverManager.updateCoordinates());
          bringViewToTop(draggableWindowState, id);
        },
        handlePopover,
        handleUpdateOpen,
      };
    },
  });
</script>
