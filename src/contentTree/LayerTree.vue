<template>
  <div class="layer-tree">
    <VcsTreeview
      v-if="tree && tree.length"
      :items="tree"
      :show-searchbar="true"
      v-model:opened="open"
      open-on-click
      :searchbar-placeholder="'content.search.placeholder'"
      item-children="visibleChildren"
    />
    <v-sheet v-else class="ma-2">
      {{ $t('content.empty') }}
    </v-sheet>
  </div>
</template>

<script>
  import { inject, computed } from 'vue';
  import { VSheet } from 'vuetify/components';
  import VcsTreeview from '../components/lists/VcsTreeview.vue';

  /**
   * @description
   * Implements Treeview and shows content tree
   */
  export default {
    name: 'VcsLayerTree',
    components: { VcsTreeview, VSheet },
    props: {
      windowState: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp');

      const open = computed({
        get: () => app.contentTree.getTreeOpenState(props.windowState.id),
        set: (value) => {
          app.contentTree
            .getTreeOpenState(props.windowState.id)
            .splice(0, Infinity, ...value);
        },
      });
      const tree = app.contentTree.getComputedVisibleTree(props.windowState.id);

      return {
        tree,
        open,
      };
    },
  };
</script>
