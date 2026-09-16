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
      {{ $st('content.empty') }}
    </v-sheet>
  </div>
</template>

<script lang="ts">
  import { defineComponent, inject, onUnmounted, shallowRef } from 'vue';
  import { VSheet } from 'vuetify/components';
  import type { Layer } from '@vcmap/core';
  import {
    getCaughtError,
    moduleIdSymbol,
    vcsLayerName,
    volatileModuleId,
    WMSLayer,
  } from '@vcmap/core';
  import { getLogger } from '@vcsuite/logger';
  import type VcsUiApp from '../vcsUiApp.js';
  import VcsHelp from '../components/notification/VcsHelp.ts.vue';
  import VcsTreeview from '../components/lists/VcsTreeview.ts.vue';
  import WMSGroupContentTreeItem from './wmsGroupContentTreeItem.js';
  import type {
    VcsDraggableItem,
    DropZones,
    ItemMovedEvent,
  } from '../components/lists/dragHelper.js';
  import {
    moveItem,
    moveDraggableItems,
    wmsLayerName,
  } from '../components/lists/dragHelper.js';
  import type { VcsAction } from '../actions/actionHelper.js';

  export const layerSwapId = 'layer-swap-window';

  type LayerSwapChildItem = {
    name: string;
    title: string;
    index: number;
    [wmsLayerName]: string;
    [vcsLayerName]: string;
  };

  type LayerSwapItem = {
    name: string;
    title: string;
    index: number;
    actions: Array<VcsAction>;
    blockOverflow: boolean;
    children?: Array<LayerSwapChildItem>;
  };

  function getWmsGroupItemsMap(app: VcsUiApp): Record<string, string> {
    return [...app.contentTree]
      .filter((i) => i instanceof WMSGroupContentTreeItem)
      .map((i) => i.toJSON())
      .reduce<Record<string, string>>((acc, cur) => {
        acc[cur.layerName] = cur.name;
        return acc;
      }, {});
  }

  function getWmsChildren(
    layer: WMSLayer,
    contentTreeItem: WMSGroupContentTreeItem,
  ): Array<LayerSwapChildItem> {
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
  export default defineComponent({
    name: 'VcsLayerSwap',
    components: { VcsTreeview, VcsHelp, VSheet },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const wmsGroupItemsMap = getWmsGroupItemsMap(app);

      const layerFilter = (l: Layer): boolean => {
        const { activeMap } = app.maps;
        return (
          l.active &&
          l[moduleIdSymbol] !== volatileModuleId &&
          !!activeMap &&
          l.isSupported(activeMap)
        );
      };

      function getLayerTreeItems(): LayerSwapItem[] {
        return [...app.layers].filter(layerFilter).map((l) => {
          const item: LayerSwapItem = {
            name: l.name,
            title: (l.properties?.title as string) || l.name,
            index: app.layers.indexOf(l),
            actions: [
              {
                name: 'layer-swap.delete',
                icon: 'mdi-delete',
                title: 'components.layerSwap.deleteButton',
                callback: (): void => {
                  l.deactivate();
                },
              },
            ],
            blockOverflow: false,
          };
          if (wmsGroupItemsMap[l.name]) {
            return {
              ...item,
              children: getWmsChildren(
                l as WMSLayer,
                app.contentTree.getByKey(
                  wmsGroupItemsMap[l.name],
                ) as WMSGroupContentTreeItem,
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

      onUnmounted(() => {
        listeners.forEach((l) => {
          l();
        });
      });

      return {
        items,
        dropTargetZones(
          item: VcsDraggableItem,
          targetItem: VcsDraggableItem,
        ): DropZones {
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
        move(event: ItemMovedEvent): void {
          const { item, targetItem, position } = event;
          const layer = app.layers.getByKey(item.name);
          if (layer && !targetItem[vcsLayerName]) {
            moveItem(app.layers, event);
          } else if (item[vcsLayerName] === targetItem[vcsLayerName]) {
            const wmsLayer = app.layers.getByKey(item[vcsLayerName]);
            if (wmsLayer instanceof WMSLayer) {
              const newLayerNames = wmsLayer.getLayers();
              moveDraggableItems(newLayerNames, {
                item: item[wmsLayerName] as string,
                targetItem: targetItem[wmsLayerName] as string,
                position,
              });
              wmsLayer.setLayers(newLayerNames).catch((e: unknown) => {
                getLogger('LayerSwap.ts.vue').error(getCaughtError(e).message);
              });
            }
          }

          items.value = getLayerTreeItems();
        },
      };
    },
  });
</script>
