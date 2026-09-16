<template>
  <div class="layer-tree">
    <VcsTreeview
      v-if="tree && tree.length"
      :items="tree"
      :show-searchbar="true"
      v-model:opened="open"
      open-on-click
      :searchbar-placeholder="'content.search.placeholder'"
      :item-children="itemChildrenProperty"
    >
      <template #search-append v-if="showAction && smAndUp">
        <VcsButton
          class="pl-2 pr-1"
          :icon="action.icon"
          :tooltip="action.title"
          :active="action.active"
          @click="action.callback()"
        />
      </template>
    </VcsTreeview>
    <v-sheet v-else class="ma-2">
      {{ $st('content.empty') }}
    </v-sheet>
  </div>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { computed, defineComponent, inject, onUnmounted } from 'vue';
  import { VSheet } from 'vuetify/components';
  import { useDisplay } from 'vuetify';
  import type VcsUiApp from '../vcsUiApp.js';
  import VcsTreeview from '../components/lists/VcsTreeview.ts.vue';
  import VcsButton from '../components/buttons/VcsButton.ts.vue';
  import LayerSwap, { layerSwapId } from './LayerSwap.ts.vue';
  import { createToggleAction } from '../actions/actionHelper.js';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import type { WindowState } from '../manager/window/windowManager.js';
  import type { VcsTreeNodeItem } from '../components/lists/treeHelper.js';

  /**
   * @description
   * Implements Treeview and shows content tree
   */
  export default defineComponent({
    name: 'VcsLayerTree',
    components: { VcsTreeview, VSheet, VcsButton },
    props: {
      windowState: {
        type: Object as PropType<WindowState>,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp') as VcsUiApp;
      const { smAndUp } = useDisplay();

      const open = computed({
        get: () => app.contentTree.getTreeOpenState(props.windowState.id),
        set: (value) => {
          app.contentTree
            .getTreeOpenState(props.windowState.id)
            .splice(0, Infinity, ...value);
        },
      });
      const tree = app.contentTree.getComputedVisibleTree(props.windowState.id);

      const showAction = computed(
        () => app.uiConfig.config.hideContentTreeRenderingOrder !== true,
      );
      const { action, destroy } = createToggleAction(
        {
          name: 'content.layerRenderOrder.name',
          title: 'content.layerRenderOrder.title',
          icon: 'mdi-swap-vertical',
        },
        {
          id: layerSwapId,
          parentId: props.windowState.id,
          component: LayerSwap,
          slot: 'dynamicChild',
          state: {
            headerIcon: 'mdi-swap-vertical',
            headerTitle: 'content.layerRenderOrder.name',
            infoUrlCallback: app.getHelpUrlCallback(
              '/components/contentspace.html#id_layerRenderOrder',
            ),
          },
        },
        app.windowManager,
        vcsAppSymbol,
      );

      onUnmounted(() => {
        destroy();
      });

      return {
        tree,
        open,
        showAction,
        smAndUp,
        action,
        itemChildrenProperty: 'visibleChildren' as keyof VcsTreeNodeItem,
      };
    },
  });
</script>
