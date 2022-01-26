<template>
  <VcsTreeview
    v-if="tree && tree.items"
    :items="tree.items"
    :has-searchbar="true"
    :searchbar-placeholder="'layer-tree.search.placeholder'"
    selectable
    @input="handleInput"
    @action-clicked="handlePopover"
    @update:open="handleUpdateOpen"
  />
</template>


<script>
  import {
    defineComponent,
    inject,
    ref,
    onMounted,
    provide,
    nextTick,
  } from '@vue/composition-api';
  import { v4 as uuid } from 'uuid';

  import { VcsTreeview, VcsLegend } from '@vcsuite/ui-components';
  import AbstractTree from '@/treeview/AbstractTree.js';
  import createTreeFromConfig from '@/treeview/createTreeFromConfig.js';

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
    components: { VcsTreeview },
    props: {
      windowId: {
        type: String,
        default: '',
      },
    },
    setup(props) {
      const tree = ref();
      const app = inject('vcsApp');
      const popoverManager = inject('popoverManager');
      const windowManager = inject('windowManager');
      const selectedIds = ref([]);
      provide('tree', tree);

      onMounted(async () => {
        tree.value = await getTree(app);
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
        const id = item.layerName + uuid();

        const componentName = 'Legend';
        const callback = () => {
          popoverManager.remove(id);
        };
        const popover = popoverManager.registerPopover({
          name: componentName,
          cmp: VcsLegend,
          id,
          parent: event.target,
          callback,
        });
        const windowComponent = document.getElementById(`window-component--${props.id}`);
        popoverManager.add(popover, windowComponent);
      };


      /**
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
        windowManager.remove(viewId);
      };

      return {
        tree,
        selectedIds: [],
        handleInput,
        handlePopover,
        handleUpdateOpen,
        close,
      };
    },
  });
</script>
