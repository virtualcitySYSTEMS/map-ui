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
      {{ $t('content.empty') }}
    </v-sheet>
  </div>
</template>

<script>
  import { inject, computed, onUnmounted } from 'vue';
  import { VSheet } from 'vuetify/components';
  import { useDisplay } from 'vuetify';
  import VcsTreeview from '../components/lists/VcsTreeview.vue';
  import VcsButton from '../components/buttons/VcsButton.vue';
  import LayerSwap, { layerSwapId } from './LayerSwap.vue';
  import { createToggleAction } from '../actions/actionHelper.js';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import { WindowSlot } from '../manager/window/windowManager.js';

  /**
   * @description
   * Implements Treeview and shows content tree
   */
  export default {
    name: 'VcsLayerTree',
    components: { VcsTreeview, VSheet, VcsButton },
    props: {
      windowState: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp');
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
          slot: WindowSlot.DYNAMIC_CHILD,
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
      };
    },
  };
</script>
