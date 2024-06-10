<template>
  <div>
    <VcsTreeview
      v-if="tree && tree.length"
      :items="tree"
      v-model:opened="opened"
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
  import { computed, inject, onMounted, reactive, watch } from 'vue';
  import { VSheet } from 'vuetify/components';
  import VcsTreeview from '../components/lists/VcsTreeview.vue';

  const openStateMapSymbol = Symbol('openStateMap');
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
      const open = app.contentTree.getTreeOpenState(props.windowState.id);
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
            open.splice(0);
            open.push(...openStateMap.get(app.maps.activeMap?.name));
          } else {
            const items = [...app.contentTree]
              .filter((i) => i.initOpen && i.getTreeViewItem().visible)
              .map(({ name }) => name);
            const oldValues = oldValue
              ? oldValue.map(getWithVisibleChildren).flat()
              : [];
            const changed = items.filter(
              (name) => !oldValues.includes(name) && !open.includes(name),
            );
            open.push(...changed);
          }
        },
        { immediate: true },
      );

      watch(open, () => {
        if (app.maps.activeMap) {
          openStateMap.set(app.maps.activeMap.name, [...open]);
        }
      });

      // the entire block, very ugly because of https://github.com/vuetifyjs/vuetify/issues/19414
      const opened = reactive([]);
      onMounted(() => {
        opened.splice(0);
        opened.push(...open);

        watch(opened, () => {
          open.splice(0);
          open.push(...opened);
        });
      });

      return {
        tree,
        opened: computed({
          get: () => opened,
          set: (value) => {
            opened.splice(0);
            opened.push(...value);
          },
        }),
      };
    },
  };
</script>
