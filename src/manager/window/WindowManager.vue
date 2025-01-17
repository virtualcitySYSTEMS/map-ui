<template>
  <div
    :class="{
      'win-container-mobile': addMobileClass,
    }"
    class="window-manager"
  >
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
        @close="close(id)"
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
    position: fixed;
    bottom: 56px;
    left: 0;
    right: 0;
    z-index: 2;
    display: contents;
  }
  .win-container-mobile > {
    div {
      width: 100% !important;
      max-width: 100% !important;
      inset: unset !important;
      border-radius: 0 !important;
      overflow: auto;
      bottom: 0 !important;
      max-height: 50% !important;
    }
  }
</style>

<script>
  import { computed, inject, onUnmounted, ref } from 'vue';
  import { useDisplay } from 'vuetify';
  import WindowComponent from './WindowComponent.vue';
  import WindowComponentHeader from './WindowComponentHeader.vue';
  import BalloonComponent from '../../featureInfo/BalloonComponent.vue';
  import {
    getPositionAppliedOnTarget,
    getTargetSize,
    moveWindow,
  } from './windowHelper.js';

  /**
   * @description WindowManager rendering all registered WindowComponents
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
        return windowManager.get(id)?.zIndex.value === windowManager.maxZIndex;
      };
      /**
       * @param {WindowComponent} windowComponent
       * @returns {WindowPosition|null}
       */
      const getPosition = (windowComponent) => {
        if (!windowComponent) {
          return null;
        }
        const parentComponent =
          !windowComponent?.state?.dockable &&
          windowManager.get(windowComponent.parentId);

        if (
          windowComponent.component.name === BalloonComponent.name ||
          (windowComponent.component.components &&
            Object.hasOwn(
              windowComponent.component.components,
              BalloonComponent.name,
            ))
        ) {
          // do not clip balloons to target
          return windowComponent?.position;
        }
        return getPositionAppliedOnTarget(
          windowComponent?.position,
          targetSize.value,
          getPosition(parentComponent),
        );
      };
      const display = useDisplay();

      /**
       * @param {string} id
       * @returns {import("vue").ComputedRef<Object>}
       */
      const getStyles = (id) =>
        computed(() => {
          const windowComponent = windowManager.get(id);
          const zIndexOffset = Number(display.sm.value); // add z-Index Offset for Tablet View to keep the windows above the detached Icon
          return {
            zIndex: windowComponent.zIndex.value + zIndexOffset,
            ...getPosition(windowComponent),
            ...(windowComponent?.state?.styles || {}),
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
        const windowComponent = windowManager.get(id);
        const position = getPosition(windowComponent);
        moveWindow(id, translation, windowManager, targetSize.value, position);
      };

      const addMobileClass = computed(() => {
        return display.xs.value && componentIds.length > 0;
      });

      const addTabletClass = computed(() => {
        return display.sm.value && componentIds.length > 0;
      });

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
        componentIds,
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
        addMobileClass,
        addTabletClass,
      };
    },
  };
</script>
