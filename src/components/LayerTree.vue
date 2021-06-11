<template>
  <DraggableWindow
    :view-id="draggableWindow.id"
    :z-index="draggableWindow.zIndex"
    @draggable-window-dropped="bringViewToTop"
    @draggable-window-closed="toggleViewVisible"
    :x="900"
    :y="100"
    :icon="'$vcsLayers'"
    :header="'layer-tree.title' | translate"
  >
    <Treeview
      v-if="items"
      :items="items"
      :has-searchbar="true"
      :searchbar-placeholder="'layer-tree.search.placeholder'"
      selectable
      @input="handleInput"
    />

    {{ items }}
  </DraggableWindow>
</template>


<script>
  import Vue from 'vue';
  import VueCompositionAPI, { defineComponent, inject, ref, onMounted, provide } from '@vue/composition-api';

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
      provide('tree', tree);

      onMounted(async () => {
        tree.value = await getTree(context);
      });

      const draggableWindowState = inject('draggableWindowState');
      const selectedIds = ref([]);

      /**
       * @param {Array<string>} value
       */
      const handleInput = (value) => {
        selectedIds.value = value;
      };

      const draggableWindow = draggableWindowState.draggableWindows[DraggableWindowId.LayerTree];

      return {
        items: tree.value.items,
        selectedIds: [],
        DraggableWindowId,
        tree,
        handleInput,
        draggableWindow,
        toggleViewVisible: id => toggleViewVisible(draggableWindowState, id),
        bringViewToTop: id => bringViewToTop(draggableWindowState, id),
      };
    },
  });
</script>
