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
        :is="getComponent(id)"
        :panel-state="getState(id)"
        v-bind="getProps(id)"
        @close="close(id)"
      />
    </PanelComponent>
  </div>
</template>

<script>
  import {
    computed,
    getCurrentInstance,
    inject,
    onUnmounted,
    reactive,
    ref,
    watch,
  } from 'vue';
  import VcsMainMap from '../../application/VcsMainMap.vue';
  import { vcsAppSymbol } from '../../pluginHelper.js';
  import { updatePanelSizes, DefaultMainPanelPosition } from './panelHelper.js';
  import {
    getPanelPosition,
    PanelLocation,
    panelLocationSymbol,
    panelPositionSymbol,
    setPanelPosition,
  } from './panelManager.js';
  import PanelComponent from './PanelComponent.vue';

  /**
   * @returns {Partial<import("./panelManager.js").PanelComponent>}
   */
  export function createMainPanel() {
    const id = 'vcs-main';
    return {
      id,
      [panelPositionSymbol]: reactive({ ...DefaultMainPanelPosition }),
      state: reactive({
        id,
        owner: vcsAppSymbol,
        location: 'vcs-main',
      }),
    };
  }

  /**
   * @description PanelManager rendering all Panels
   */
  export default {
    name: 'VcsPanelManagerComponent',
    components: {
      VcsMainMap,
      PanelComponent,
    },
    setup() {
      const app = inject('vcsApp');
      /** @type {PanelManager} */
      const { panelManager } = app;
      const { componentIds } = panelManager;
      const panelFrameRef = ref();
      const resizing = ref(undefined);
      const resizingFunction = ref(() => {});

      /**
       * @param {string} id
       * @returns {PanelState}
       */
      const getState = (id) => {
        return panelManager.get(id)?.state;
      };
      /**
       * @param {string} id
       * @returns {Object}
       */
      const getProps = (id) => {
        return panelManager.get(id)?.props ?? {};
      };
      /**
       * @param {PanelComponent} panelComponent
       * @returns {PanelPosition|null}
       */
      const getPosition = (panelComponent) => {
        return getPanelPosition(panelComponent);
      };
      /**
       * @param {string} id
       * @returns {import("vue").ComputedRef<Object>}
       */
      const getStyles = (id) =>
        computed(() => {
          const panelComponent = panelManager.get(id);
          return {
            ...getPosition(panelComponent),
            ...(panelComponent?.state?.styles || {}),
          };
        });

      const mainPanel = createMainPanel();

      const resize = (panel, e) => {
        if (panel) {
          let resizeKey;
          if (panel[panelLocationSymbol] === PanelLocation.BOTTOM) {
            const frameRect = panelFrameRef.value.getBoundingClientRect();
            const height =
              ((frameRect.bottom - e.clientY) /
                panelFrameRef.value.parentElement.offsetHeight) *
              100;
            setPanelPosition(panelManager, panel, {
              height: `${Math.round(height)}%`,
            });
          } else {
            const width =
              ((panelFrameRef.value.offsetLeft + e.x) /
                panelFrameRef.value.parentElement.offsetWidth) *
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

      const setResizing = (id) => {
        if (id) {
          resizing.value = id;
          resizingFunction.value = (e) => {
            e.preventDefault();
            resize(panelManager.get(id), e);
          };
        } else {
          resizing.value = undefined;
          resizingFunction.value = () => {};
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
            panelFrameRef.value.getBoundingClientRect(),
          );
        },
      );

      const addMobileClass = computed(() => {
        return (
          getCurrentInstance().proxy.$vuetify.breakpoint.xs &&
          componentIds.length > 0
        );
      });

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
        getComponent: (id) => panelManager.get(id).component,
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
        close: (id) => {
          panelManager.remove(id);
        },
      };
    },
  };
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
