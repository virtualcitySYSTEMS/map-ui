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
  import { inject, ref, watch } from 'vue';
  import { VSheet } from 'vuetify/components';
  import VcsTreeview from '../components/lists/VcsTreeview.vue';

  /** The open state Symbol of the ContentTree */
  export const openStateMapSymbol = Symbol('openStateMap');
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
      const open = ref(app.contentTree.getTreeOpenState(props.windowState.id));
      const tree = app.contentTree.getComputedVisibleTree(props.windowState.id);

      function getWithVisibleChildren(item) {
        return [
          item.name,
          ...(item.visibleChildren
            ?.map((c) => getWithVisibleChildren(c))
            ?.flat() ?? []),
        ];
      }

      if (!app.contentTree[openStateMapSymbol]) {
        app.contentTree[openStateMapSymbol] = new Map();
      }
      /**
       * @type {Map<string, string[]>}
       */
      const openStateMap = app.contentTree[openStateMapSymbol];
      // watch for new visible children, which should start init open
      watch(
        tree,
        (value, oldValue) => {
          if (openStateMap.has(app.maps.activeMap?.name)) {
            open.value = openStateMap.get(app.maps.activeMap?.name);
          } else {
            const items = [...app.contentTree]
              .filter((i) => i.initOpen && i.getTreeViewItem().visible)
              .map(({ name }) => name);
            const oldValues = oldValue
              ? oldValue.map(getWithVisibleChildren).flat()
              : [];
            const changed = items.filter(
              (name) => !oldValues.includes(name) && !open.value.includes(name),
            );
            open.value.push(...changed);
          }
        },
        { immediate: true },
      );

      watch(open, () => {
        if (app.maps.activeMap) {
          openStateMap.set(app.maps.activeMap.name, [...open.value]);
        }
      });

      return {
        tree,
        open,
      };
    },
  };
</script>
