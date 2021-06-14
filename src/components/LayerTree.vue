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
  import { popoverState } from '@/modules/popover/popover.state';
  import { removePopover } from '@/modules/popover/popover.mutations';
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
      const overlayRefs = new Map();
      const context = inject('context');
      const popoversState = inject('popoversState');
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
       * @param {Object} popover
       * Assigns the current x and v value of a popover to the ref.
       */
      const setCoordinates = (popover) => {
        if (overlayRefs.has(popover.id)) {
          const overlayRef = overlayRefs.get(popover.id);
          if (document.contains(overlayRef)) {
            const { x, y } = overlayRef.getBoundingClientRect();
            Object.assign(popover, { coordinates: { x, y } });
          } else {
            /**
             * If the referenced element is no longer in the DOM
             */
            overlayRefs.delete(popover.id);
          }
        }
      };

      /**
       * @function
       * @param {Object} obj Destructured argument
       * @param {AbstractTreeNode} obj.item The object that has been clicked
       * @param {Event} obj.event The click event
       * @description Callback from Treeview which invokes an overlay to be shown.
       * 1. Import the component
       * 2. Register the component
       */
      const handlePopover = async ({ item, event }) => {
        /**
         * If the user clicks the icon while the popover is active, we hide it
         */
        if (popoversState.items.find(p => p.id === item.layerName)) {
          removePopover(popoversState, item.layerName);
          overlayRefs.delete(item.layerName);
          return;
        }

        /**
         * We defined our component by:
         * 1. Giving it a name
         * 2. Importing it dynically
         * 3. Registering it globally
         * 4. Storing the action button reference
         * 5. Defining a callback for when an input has occured
         * 6. Giving it an id
         * 7. Pushing it to the array of all popovers
         * 8. Setting inital coordinates
         */
        const componentName = 'Legend';
        const cmp = await import(`@vcsuite/uicomponents/${componentName}.vue`);
        Vue.component(componentName, cmp.default);

        overlayRefs.set(item.layerName, event.target);

        const callback = (val) => {
          // eslint-disable-next-line no-console
          console.log(val);
          removePopover(popoversState, item.layerName);
        };
        const popover = {
          ...popoverState,
          component: componentName,
          callback,
          id: item.layerName,
        };
        popoversState.items = [...popoversState.items, popover];
        setCoordinates(popover);
      };

      const draggableWindow = draggableWindowState.draggableWindows[DraggableWindowId.LayerTree];

      /**
       * @function
       * @description
       * Hides the popovers whih are open at the moment.
       */
      const handleUpdateOpen = () => {
        nextTick(() => {
          Array.from(overlayRefs.keys()).forEach((key) => {
            if (!document.contains(overlayRefs.get(key))) {
              removePopover(popoversState, key);
            }
          });
        });
      };

      return {
        tree,
        selectedIds: [],
        DraggableWindowId,
        handleInput,
        draggableWindow,
        toggleViewVisible: id => toggleViewVisible(draggableWindowState, id),
        bringViewToTop: (id) => {
          nextTick(() => popoversState.items.forEach(p => setCoordinates(p)));
          return bringViewToTop(draggableWindowState, id);
        },
        handlePopover,
        handleUpdateOpen,
      };
    },
  });
</script>
