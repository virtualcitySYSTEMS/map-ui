<template>
  <div class="layer-tree">
    <VcsHelp text="content.layerRenderOrder.help" />
    <VcsTreeview
      v-if="items && items.length"
      :items="items"
      :show-searchbar="false"
      :draggable="true"
      open-all
      :drop-target-zones="dropTargetZones"
      @item-moved="move"
    />
    <v-sheet v-else class="ma-2">
      {{ $t('content.empty') }}
    </v-sheet>
  </div>
</template>

<script>
  import { inject, onUnmounted, shallowRef } from 'vue';
  import { VSheet } from 'vuetify/components';
  import {
    moduleIdSymbol,
    vcsLayerName,
    volatileModuleId,
    WMSLayer,
  } from '@vcmap/core';
  import { getLogger } from '@vcsuite/logger';
  import VcsHelp from '../components/notification/VcsHelp.vue';
  import VcsTreeview from '../components/lists/VcsTreeview.vue';
  import WMSGroupContentTreeItem from './wmsGroupContentTreeItem.js';

  export const layerSwapId = 'layer-swap-window';

  const wmsLayerName = Symbol('wmsLayerName');

  function getWmsGroupItemsMap(app) {
    return [...app.contentTree]
      .filter((i) => i instanceof WMSGroupContentTreeItem)
      .map((i) => i.toJSON())
      .reduce((acc, cur) => {
        acc[cur.layerName] = cur.name;
        return acc;
      }, {});
  }

  /**
   * @param {import("@vcmap/core").WMSLayer} layer
   * @param {import("./wmsGroupContentTreeItem.js").WMSGroupContentTreeItem} contentTreeItem
   * @returns {Array<Partial<import("./contentTreeItem.js").TreeViewItem> & { index: number, [wmsLayerName]: string, [vcsLayerName]: string}>}
   */
  function getWmsChildren(layer, contentTreeItem) {
    const layers = layer.getLayers();
    return layers.map((l, index) => ({
      name: `${layer.name}.${l}`,
      title: contentTreeItem.wmsEntries.find((e) => e.name === l)?.title || l,
      index,
      [wmsLayerName]: l,
      [vcsLayerName]: layer.name,
    }));
  }

  /**
   * @description
   * Implements Treeview and shows content tree
   */
  export default {
    name: 'VcsLayerSwap',
    components: { VcsTreeview, VcsHelp, VSheet },
    setup() {
      const app = inject('vcsApp');
      const wmsGroupItemsMap = getWmsGroupItemsMap(app);

      /**
       * @param {import("@vcmap/core").Layer} l
       * @returns {boolean}
       */
      const layerFilter = (l) => {
        return (
          l.active &&
          l[moduleIdSymbol] !== volatileModuleId &&
          l.isSupported(app.maps.activeMap)
        );
      };

      function getLayerTreeItems() {
        return [...app.layers].filter(layerFilter).map((l) => {
          const item = {
            name: l.name,
            title: l.properties?.title || l.name,
            index: app.layers.indexOf(l),
            actions: [
              {
                name: 'layer-swap.delete',
                icon: 'mdi-delete',
                title: 'components.layerSwap.deleteButton',
                callback: () => l.deactivate(),
              },
            ],
            blockOverflow: false,
          };
          if (wmsGroupItemsMap[l.name]) {
            return {
              ...item,
              children: getWmsChildren(
                l,
                app.contentTree.getByKey(wmsGroupItemsMap[l.name]),
              ),
            };
          }
          return item;
        });
      }

      const items = shallowRef(getLayerTreeItems());

      const listeners = [
        app.layers.stateChanged.addEventListener(() => {
          items.value = getLayerTreeItems();
        }),
        app.maps.mapActivated.addEventListener(() => {
          items.value = getLayerTreeItems();
        }),
      ];

      onUnmounted(() => listeners.forEach((l) => l()));

      return {
        items,
        dropTargetZones(item, targetItem) {
          const isTopLevelItem = items.value.some((i) => i.name === item.name);
          const isTopLevelTarget = items.value.some(
            (i) => i.name === targetItem.name,
          );
          if (
            isTopLevelItem !== isTopLevelTarget ||
            (!isTopLevelItem &&
              !isTopLevelTarget &&
              item[vcsLayerName] !== targetItem[vcsLayerName])
          ) {
            // do not allow dragging on different levels or on different nodes
            return false;
          }
          return { into: false };
        },
        move({ item, targetItem }) {
          const layer = app.layers.getByKey(item.name);
          if (layer && !targetItem[vcsLayerName]) {
            app.layers.moveTo(layer, targetItem.index);
          } else if (item[vcsLayerName] === targetItem[vcsLayerName]) {
            const wmsLayer = app.layers.getByKey(item[vcsLayerName]);
            if (wmsLayer instanceof WMSLayer) {
              const newLayerNames = wmsLayer.getLayers();
              newLayerNames.splice(item.index, 1);
              newLayerNames.splice(targetItem.index, 0, item[wmsLayerName]);
              wmsLayer
                .setLayers(newLayerNames)
                .catch((e) => getLogger('LayerSwap.vue').error(e));
            }
          }

          items.value = getLayerTreeItems();
        },
      };
    },
  };
</script>
