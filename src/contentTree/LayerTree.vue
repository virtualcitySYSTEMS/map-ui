<template>
  <VcsTreeview
    v-if="tree && tree.length"
    :items="tree"
    :open.sync="open"
    :show-searchbar="true"
    :searchbar-placeholder="'content.search.placeholder'"
    item-children="visibleChildren"
  />
</template>

<script>
  import { inject } from 'vue';
  import VcsTreeview from '../components/lists/VcsTreeview.vue';

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
      const open = app.contentTree.getTreeOpenStateRef(props.windowState.id);
      return {
        tree: app.contentTree.getComputedVisibleTree(props.windowState.id),
        open,
      };
    },
  };
</script>
