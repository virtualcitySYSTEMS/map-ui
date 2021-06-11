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
      v-if="tree && tree.items"
      :items="tree.items"
      :has-searchbar="true"
      :searchbar-placeholder="'layer-tree.search.placeholder'"
      selectable
      @input="handleInput"
      @action-clicked="handleActionClicked"
    />
  </DraggableWindow>
</template>


<script>
  import Vue from 'vue';
  import VueCompositionAPI, {
    defineComponent, inject, ref, onMounted, provide, nextTick,
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
      const overlayRef = ref();
      const context = inject('context');
      const popover = inject('popover');
      const draggableWindowState = inject('draggableWindowState');
      provide('tree', tree);

      onMounted(async () => {
        tree.value = await getTree(context);
      });

      const selectedIds = ref([]);

      /**
       * @param {Array<string>} value
       */
      const handleInput = (value) => {
        selectedIds.value = value;
      };

      /**
       * @function
       * @description
       * Assigns the current x and v value of a popover to the ref.
       */
      const setCoordinates = () => {
        const { x, y } = overlayRef.value.getBoundingClientRect();
        Object.assign(popover, { coordinates: { x, y } });
      };

      /**
       * @param {Object} obj
       * @param {AbstractTreeNode} obj.item
       * @param {Event} obj.event
       */
      const handleActionClicked = ({ item, event }) => {
        // Could also be item.component
        const cmp = Vue.extend({
          name: 'Foo',
          template: '<span @click="callback" class="v-sheet pa-2">x: {{ coordinates.x }}  y: {{coordinates.y}}</span>',
          props: {
            coordinates: {
              type: Object,
              default: () => ({ x: 0, y: 0 }),
            },
            callback: {
              type: Function,
              default: () => {
                // eslint-disable-next-line no-console
                console.log('Please implement callback function');
              },
            },
          },
        });

        Vue.component('foo', cmp);

        overlayRef.value = event.target;

        const callback = () => {
          popover.component = undefined;
        };
        const popoverProps = {
          component: popover.component = 'foo',
          coordinates: {},
          callback,
        };

        Object.assign(popover, popoverProps);
        setCoordinates();
      };

      const draggableWindow = draggableWindowState.draggableWindows[DraggableWindowId.LayerTree];

      return {
        tree,
        selectedIds: [],
        DraggableWindowId,
        handleInput,
        draggableWindow,
        toggleViewVisible: id => toggleViewVisible(draggableWindowState, id),
        bringViewToTop: (id) => {
          nextTick(() => setCoordinates());
          return bringViewToTop(draggableWindowState, id);
        },
        handleActionClicked,
      };
    },
  });
</script>
