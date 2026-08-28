<template>
  <div
    class="vcs-panel-frame panel-manager-component"
    @pointerup="setResizing(undefined)"
    @pointerleave="setResizing(undefined)"
    ref="panelFrameRef"
  >
    <div
      v-if="resizing"
      class="resize-overlay"
      :style="{ cursor: resizeCursor }"
      @pointermove="resizingFunction"
    ></div>
    <PanelComponent
      :panel-state="mainPanel.state"
      :style="getPosition(mainPanel)"
    >
      <VcsMainMap />
    </PanelComponent>
    <PanelComponent
      v-for="id in componentIds"
      :key="id"
      :panel-state="getState(id)"
      :style="getStyles(id).value"
      :class="getState(id).classes"
      @resize="setResizing"
    >
      <component
        v-if="getComponent(id)"
        :is="getComponent(id)"
        :panel-state="getState(id)"
        v-bind="getProps(id)"
        @close="close(id)"
      />
    </PanelComponent>
  </div>
</template>

<script lang="ts">
  import type { Component, ComputedRef } from 'vue';
  import {
    computed,
    defineComponent,
    inject,
    onUnmounted,
    reactive,
    ref,
    watch,
  } from 'vue';
  import { useDisplay } from 'vuetify';
  import VcsMainMap from '../../application/VcsMainMap.ts.vue';
  import type VcsUiApp from '../../vcsUiApp.js';
  import { vcsAppSymbol } from '../../pluginHelper.js';
  import { updatePanelSizes, defaultMainPanelPosition } from './panelHelper.js';
  import type {
    PanelComponent as PanelComponentType,
    PanelPosition,
    PanelState,
  } from './panelManager.js';
  import {
    getPanelPosition,
    PanelLocation,
    panelLocationSymbol,
    panelPositionSymbol,
    setPanelPosition,
  } from './panelManager.js';
  import PanelComponent from './PanelComponent.ts.vue';

  export function createMainPanel(): PanelComponentType {
    const id = 'vcs-main';
    return {
      id,
      props: {},
      provides: {},
      state: reactive<PanelState>({
        id,
        owner: vcsAppSymbol,
        location: 'vcs-main',
      }),
      [panelPositionSymbol]: reactive({ ...defaultMainPanelPosition }),
      [panelLocationSymbol]: 'vcs-main',
    };
  }

  /**
   * @description PanelManager rendering all Panels
   */
  export default defineComponent({
    name: 'VcsPanelManagerComponent',
    components: {
      VcsMainMap,
      PanelComponent,
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const { panelManager } = app;
      const { componentIds } = panelManager;
      const panelFrameRef = ref<HTMLElement>();
      const resizing = ref<string>();
      const resizingFunction = ref<(e: PointerEvent) => void>(() => {});

      const getState = (id: string): PanelState => {
        return panelManager.get(id)?.state;
      };
      const getProps = (id: string): Record<string, unknown> => {
        return panelManager.get(id)?.props ?? {};
      };
      const getPosition = (
        panelComponent: PanelComponentType,
      ): PanelPosition | undefined => {
        return getPanelPosition(panelComponent);
      };
      const getStyles = (id: string): ComputedRef<Record<string, unknown>> =>
        computed(() => {
          const panelComponent = panelManager.get(id);
          return {
            ...getPosition(panelComponent),
            ...(panelComponent?.state?.styles || {}),
          };
        });

      const mainPanel = createMainPanel();

      const resize = (panel: PanelComponentType, e: PointerEvent): void => {
        if (panel && panelFrameRef.value) {
          let resizeKey;
          if (panel[panelLocationSymbol] === PanelLocation.BOTTOM) {
            const frameRect = panelFrameRef.value.getBoundingClientRect();
            const height =
              ((frameRect.bottom - e.clientY) /
                panelFrameRef.value.parentElement!.offsetHeight) *
              100;
            setPanelPosition(panelManager, panel, {
              height: `${Math.round(height)}%`,
            });
          } else {
            const width =
              ((panelFrameRef.value.offsetLeft + e.x) /
                panelFrameRef.value.parentElement!.offsetWidth) *
              100;
            if (panel[panelLocationSymbol] === PanelLocation.LEFT) {
              setPanelPosition(panelManager, panel, { width: `${width}%` });
              resizeKey = 'left';
            } else if (panel[panelLocationSymbol] === PanelLocation.RIGHT) {
              setPanelPosition(panelManager, panel, {
                width: `${Math.round(100 - width)}%`,
              });
              resizeKey = 'right';
            }
          }
          updatePanelSizes(
            panelManager,
            mainPanel,
            panelFrameRef.value.getBoundingClientRect(),
            resizeKey,
          );
        }
      };

      const setResizing = (id?: string): void => {
        if (id) {
          resizing.value = id;
          resizingFunction.value = (e): void => {
            e.preventDefault();
            resize(panelManager.get(id), e);
          };
        } else {
          resizing.value = undefined;
          resizingFunction.value = (): void => {};
        }
      };

      // Clean up resizing state on unmount
      onUnmounted(() => {
        setResizing(undefined);
      });

      watch(
        () => [...componentIds],
        () => {
          updatePanelSizes(
            panelManager,
            mainPanel,
            panelFrameRef.value!.getBoundingClientRect(),
          );
        },
      );

      const addMobileClass = computed(
        () => useDisplay().xs.value && componentIds.length > 0,
      );
      const resizeCursor = computed(() => {
        if (!resizing.value) {
          return 'default';
        }
        const panel = panelManager.get(resizing.value);
        if (panel && panel[panelLocationSymbol] === PanelLocation.BOTTOM) {
          return 'n-resize';
        }
        return 'ew-resize';
      });

      return {
        mainPanel,
        componentIds,
        getComponent: (id: string): Component | undefined =>
          panelManager.get(id).component,
        getPosition,
        getStyles,
        getState,
        getProps,
        addMobileClass,
        panelFrameRef,
        resizing,
        resizeCursor,
        setResizing,
        resizingFunction,
        close: (id: string): void => {
          panelManager.remove(id);
        },
      };
    },
  });
</script>

<style scoped lang="scss">
  .vcs-panel-frame {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }
  .vcs-panel-border {
    padding: 5px;
  }
  .resize-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }
</style>
