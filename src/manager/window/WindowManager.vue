<template>
  <div :class="{ 'win-container-mobile': $vuetify.breakpoint.xs }">
    <WindowComponent
      v-for="id in componentIds"
      :key="id"
      :window-state="getState(id)"
      :slot-window="getSlot(id)"
      :z-index="getComponent(id).zIndex"
      @moved="move(id, $event)"
      @mousedown="bringWindowToTop(id)"
      :style="getStyles(id).value"
      :class="getState(id).classes"
      :is-on-top="isOnTop(id)"
    >
      <component
        :is="getComponent(id)"
        :window-state="getState(id)"
        v-bind="getProps(id)"
      />
      <template v-if="!getState(id).hideHeader" #headerComponent>
        <component
          :is="getHeaderComponent(id)"
          :window-state="getState(id)"
          :is-on-top="isOnTop(id)"
          :slot-window="getSlot(id)"
          v-bind="getProps(id)"
          @close="close(id)"
          @pin="pin(id)"
        />
      </template>
    </WindowComponent>
  </div>
</template>

<style scoped lang="scss">
  .win-container-mobile {
    position: absolute;
    z-index: 2;
    width: 100%;
  }
  .win-container-mobile > {
    div {
      width: 100% !important;
      inset: unset !important;
      border-radius: 0 !important;
    }
  }
</style>

<script>
  import { computed, inject, onUnmounted, ref } from 'vue';

  import WindowComponent from './WindowComponent.vue';
  import WindowComponentHeader from './WindowComponentHeader.vue';
  import {
    applyPositionOnTarget,
    getTargetSize,
    moveWindow,
  } from './windowHelper.js';

  /**
   * WindowManager rendering all registered WindowComponents
   */
  export default {
    name: 'VcsWindowManager',
    components: { WindowComponent },
    setup() {
      const app = inject('vcsApp');
      /** @type {WindowManager} */
      const { windowManager } = app;
      const { componentIds } = windowManager;
      const targetSize = ref(null);
      /**
       * @param {string} id
       * @returns {WindowState}
       */
      const getState = (id) => {
        return windowManager.get(id)?.state;
      };
      /**
       * @param {string} id
       * @returns {Object}
       */
      const getProps = (id) => {
        return windowManager.get(id)?.props ?? {};
      };
      /**
       * @param {string} id
       * @returns {boolean}
       */
      const isOnTop = (id) => {
        return windowManager.get(id)?.zIndex.value === componentIds.length - 1;
      };
      /**
       * @param {string} id
       * @returns {import("vue").ComputedRef<Object>}
       */
      const getStyles = (id) =>
        computed(() => {
          const windowComponent = windowManager.get(id);
          const state = windowComponent?.state;
          const position = applyPositionOnTarget(
            windowComponent?.position,
            targetSize.value,
          );
          return {
            zIndex: windowComponent.zIndex.value,
            ...position,
            ...(state.styles || {}),
          };
        });
      /**
       * @param {string} id
       */
      const bringWindowToTop = (id) => {
        if (windowManager.has(id) && !isOnTop(id)) {
          windowManager.bringWindowToTop(id);
        }
      };
      /**
       * @param {string} id
       * @param {{dx: number, dy: number}} translation
       */
      const move = (id, translation) => {
        moveWindow(id, translation, windowManager, targetSize.value);
      };

      const setTargetSize = () => {
        targetSize.value = getTargetSize(app.maps.target);
      };
      window.addEventListener('resize', setTargetSize);
      const setTargetDestroy =
        app.maps.mapActivated.addEventListener(setTargetSize);

      onUnmounted(() => {
        window.removeEventListener('resize', setTargetSize);
        setTargetDestroy();
      });

      return {
        componentIds: ref(componentIds),
        getComponent: (id) => windowManager.get(id).component,
        getHeaderComponent: (id) =>
          windowManager.get(id).headerComponent || WindowComponentHeader,
        getStyles,
        getState,
        getProps,
        isOnTop,
        getSlot: (id) => windowManager.get(id).slot,
        close: (id) => {
          windowManager.remove(id);
        },
        pin: (id) => {
          windowManager.pinWindow(id);
        },
        bringWindowToTop,
        move,
      };
    },
  };
</script>
