<template>
  <VcsTreeview
    v-if="tree && tree.length"
    :items="tree"
    :open.sync="open"
    :has-searchbar="true"
    :searchbar-placeholder="'layer-tree.search.placeholder'"
    item-children="visibleChildren"
  />
</template>


<script>
  import { inject } from '@vue/composition-api';
  import { VcsTreeview } from '@vcsuite/ui-components';

  /**
   * @description
   * Implements Treeview and shows 'vcs.vcm.widgets.legend.Legend'
   */
  export default {
    name: 'VcsLayerTree',
    components: { VcsTreeview },
    props: {
      windowState: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp');
      const { id } = props.windowState;
      const open = app.contentTree.getTreeOpenStateRef(id);
      return {
        tree: app.contentTree.getComputedVisibleTree(id),
        open,
      };
    },
  };
</script>
