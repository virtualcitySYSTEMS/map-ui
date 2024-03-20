<template>
  <div>
    <VcsTreeview
      v-if="tree && tree.length"
      :items="tree"
      :open.sync="open"
      :show-searchbar="true"
      :searchbar-placeholder="'content.search.placeholder'"
      item-children="visibleChildren"
    />
    <v-sheet v-else class="ma-2">
      {{ $t('content.empty') }}
    </v-sheet>
  </div>
</template>

<script>
  import { inject, watch } from 'vue';
  import { VSheet } from 'vuetify/lib';
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
      const open = app.contentTree.getTreeOpenStateRef(props.windowState.id);

      const initOpen = app.contentTree
        .getChildrenForSubTree(props.windowState.id)
        .filter((i) => i.initOpen)
        .map((i) => i.name);

      const tree = app.contentTree.getComputedVisibleTree(props.windowState.id);

      // watch for new visible children, which should start init open
      watch(tree, (value, oldValue) => {
        const changed = value
          .filter(
            ({ name }) =>
              !oldValue.find((o) => o.name === name) && initOpen.includes(name),
          )
          .map(({ name }) => name);
        open.value.push(...changed);
      });

      return {
        tree,
        open,
      };
    },
  };
</script>
