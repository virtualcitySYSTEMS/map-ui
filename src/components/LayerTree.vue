<template>
  <DraggableWindow
    :view-id="draggableWindows[DraggableWindowId.LayerTree].id"
    :z-index="draggableWindows[DraggableWindowId.LayerTree].zIndex"
    @draggable-window-dropped="bringViewToTop"
    @draggable-window-closed="toggleViewVisible"
    :x="900"
    :y="100"
    :icon="'$vcsLayers'"
    :header="'layer-tree.title' | translate"
  >
    <Treeview
      v-if="tree"
      :items="tree.items"
      :has-searchbar="true"
      :searchbar-placeholder="'layer-tree.search.placeholder'"
      selectable
      @input="handleInput"
    />
  </DraggableWindow>
</template>


<script>
  import Vue from 'vue';
  import { mapFields } from 'vuex-map-fields';

  import Treeview from '@vcsuite/uicomponents/Treeview.vue';
  import DraggableWindow from '@/modules/draggable-window/DraggableWindow.vue';
  import DraggableWindowId from '@/modules/draggable-window/draggable-window-id';
  import { v4 } from 'uuid';
  import { ref, inject, onMounted } from '@vue/composition-api';
  import AbstractTree from '@/treeview/AbstractTree';
  import createTreeFromConfig from '@/treeview/createTreeFromConfig';

  /**
   * @function
   * @param {Object} obj
   * @returns {Object}
   * @description helper to recursively attach uuids
   */
  const appendId = (obj) => {
    obj.id = v4();

    if (obj.children) {
      obj.children = obj.children.map(appendId);
    }

    return obj;
  };

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
  export default Vue.extend({
    name: 'VcsLayerTree',
    components: { Treeview, DraggableWindow },
    setup() {
      const tree = ref(null);
      const context = inject('context');

      onMounted(async () => {
        tree.value = await getTree(context);
      });

      return {
        DraggableWindowId,
        tree,
        selectedIds: [],
      };
    },
    inject: ['context'],
    computed: {
      ...mapFields('draggableWindowStoreModule', ['draggableWindows']),
    },
    // mounted() {
    //   this.items = this.context.config.widgets.find(w => w.type === 'vcs.vcm.widgets.legend.Legend').items;
    //   // Add id to every element, otherwise the treeview will break when toggling checkboxes
    //   this.items = this.items.map(appendId);
    // },
    methods: {
      bringViewToTop() {
        this.$store.commit('draggableWindowStoreModule/bringViewToTop', DraggableWindowId.LayerTree);
      },
      toggleViewVisible() {
        this.$store.commit('draggableWindowStoreModule/toggleViewVisible', DraggableWindowId.LayerTree);
      },
      /**
       * @param {Array<string>} selectedIds
       */
      handleInput(selectedIds) {
        this.selectedIds = selectedIds;
      },
    },
  });
</script>
