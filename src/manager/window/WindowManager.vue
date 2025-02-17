<template>
  <div class="window-manager" :class="{ oblique: isOblique, mobile: xs }">
    <WindowComponent
      v-for="id in componentIds"
      :key="id"
      :window-state="getState(id)"
      :slot-window="getSlot(id)"
      :z-index="getComponent(id).zIndex"
      @moved="move(id, $event)"
      @mousedown="bringWindowToTop(id)"
      @touchstart="onTouchStart($event)"
      @touchmove="onTouchMove($event)"
      @touchend="onTouchEnd($event, id)"
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
  .mobile > div:not(#window-component--searchId) {
    position: fixed;
    left: 0;
    right: 0;
    z-index: 2;
    display: contents;
    width: 100% !important;
    max-width: 100% !important;
    inset: unset !important;
    border-radius: 0 !important;
    overflow: auto;
    bottom: 0 !important;
    max-height: 50% !important;
  }
  .mobile > div {
    transition: transform 0.4s ease;
  }

  .mobile > #window-component--searchId {
    position: fixed !important;
    top: calc(var(--v-vcs-font-size) * 5 + 28px) !important;
    left: 5px !important;
    right: calc(var(--v-vcs-font-size) * 5 + 2px) !important;
    z-index: 2;
    border-radius: 4px !important;
    width: inherit !important;
    padding-right: 1px !important;
    .py-1 {
      padding: 0px !important;
    }
  }
  .mobile > #window-component--searchId > div > div {
    border-radius: 4px !important;
  }

  .oblique > #window-component--searchId {
    right: calc(var(--v-vcs-font-size) * 6.25 + 2px) !important;
  }
</style>

<script>
  import { computed, inject, onUnmounted, ref, watch } from 'vue';
  import { useDisplay } from 'vuetify';
  import { ObliqueMap } from '@vcmap/core';
  import WindowComponent from './WindowComponent.vue';
  import WindowComponentHeader from './WindowComponentHeader.vue';
  import BalloonComponent from '../../featureInfo/BalloonComponent.vue';
  import {
    getPositionAppliedOnTarget,
    getTargetSize,
    moveWindow,
  } from './windowHelper.js';
  import { mobileMenuListId } from '../../application/VcsNavbarMobile.vue';
  import { useFontSize } from '../../vuePlugins/vuetify.js';

  /**
   * @description WindowManager rendering all registered WindowComponents
   */
  export default {
    name: 'VcsWindowManager',
    components: { WindowComponent },
    setup() {
      const app = inject('vcsApp');
      /** @type {WindowManager} */
      const { windowManager, toolboxManager } = app;
      const { componentIds } = windowManager;
      const targetSize = ref(null);
      const touchStartY = ref(0);
      const touchCurrentY = ref(0);
      const isTouching = ref(false);
      const fontSize = useFontSize();
      const { sm } = useDisplay();
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
        // reduce target size for Tablet View to compensate for the toolbar not overlapping
        const size = structuredClone(targetSize.value);
        if (toolboxManager.open.value && sm.value && size) {
          size.height -= fontSize.value * 3 + 6;
        }

        return getPositionAppliedOnTarget(
          windowComponent?.position,
          size,
          getPosition(parentComponent),
        );
      };
      const display = useDisplay();

      const addMobileClass = computed(() => {
        return display.xs.value && componentIds.length > 0;
      });

      const addTabletClass = computed(() => {
        return display.sm.value && componentIds.length > 0;
      });

      /**
       * @param {string} id
       * @returns {import("vue").ComputedRef<Object>}
       */
      const getStyles = (id) =>
        computed(() => {
          const windowComponent = windowManager.get(id);
          const zIndexOffset =
            Number(display.sm.value) || Number(display.xs.value); // add z-Index Offset for Tablet View to keep the windows above the detached Icon
          return {
            zIndex: `${windowComponent.zIndex.value + zIndexOffset} !important`,
            ...getPosition(windowComponent),
            ...(windowComponent?.state?.styles || {}),
          };
        });

      const isOblique = ref(false);
      // fix search width to oblique map
      const mobileSearchObliqueListener =
        app.maps.mapActivated.addEventListener((map) => {
          isOblique.value = map instanceof ObliqueMap;
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

      const setTargetSize = () => {
        targetSize.value = getTargetSize(app.maps.target);
      };
      window.addEventListener('resize', setTargetSize);
      const setTargetDestroy =
        app.maps.mapActivated.addEventListener(setTargetSize);

      let exclusiveWindowListener;

      /**
       * Sets up an exclusive window listener for mobile view.
       * When a new window is added, it removes all other windows except the search window.
       * The search window is placed at the top of the page and allows opening of one other window, e.g. for displaying feature information.
       */
      function setupExclusiveWindowListener() {
        if (display.xs.value) {
          exclusiveWindowListener = app.windowManager.added.addEventListener(
            (e) => {
              componentIds
                .filter((id) => id !== e.id)
                .forEach((id) => {
                  if (id !== 'searchId') {
                    app.windowManager.remove(id);
                  } else if (
                    id === 'searchId' &&
                    componentIds.includes('Content')
                  ) {
                    app.windowManager.remove('searchId');
                  }
                });
            },
          );
        } else {
          exclusiveWindowListener?.();
        }
      }

      setupExclusiveWindowListener();

      watch(display.xs, () => {
        setupExclusiveWindowListener();
        if (componentIds.includes(mobileMenuListId)) {
          windowManager.remove(mobileMenuListId);
        }
      });

      onUnmounted(() => {
        window.removeEventListener('resize', setTargetSize);
        exclusiveWindowListener?.();
        setTargetDestroy();
        mobileSearchObliqueListener();
      });

      /**
       * Handles the touch start event for mobile view.
       * Initializes the touch start position and sets the isTouching flag.
       * Only starts the drag if the touch starts within the first 50 pixels of the window.
       * @param {TouchEvent} event - The touch start event.
       */
      const onTouchStart = (event) => {
        if (!addMobileClass.value) return; // Only on mobile view
        const windowElement = event.currentTarget;
        // Get the Y-coordinate of the drag start relative to the window's top
        const touchStartYRelativeToWindow =
          event.touches[0].clientY - windowElement.getBoundingClientRect().top;
        // Only start drag if the starting position is within the first 50 pixels of the window
        if (touchStartYRelativeToWindow > 50) return;
        touchStartY.value = event.touches[0].clientY;
        touchCurrentY.value = touchStartY.value;
        isTouching.value = true;
      };

      /**
       * Handles the touch move event for mobile view.
       * Adjusts the window position during drag based on the touch movement.
       * @param {TouchEvent} event - The touch move event.
       */
      const onTouchMove = (event) => {
        if (!isTouching.value) return;
        touchCurrentY.value = event.touches[0].clientY;

        // Adjust the window position during drag
        const deltaY = touchCurrentY.value - touchStartY.value;
        const windowElement = event.currentTarget;
        if (windowElement) {
          windowElement.style.transform = `translateY(${Math.max(0, deltaY)}px)`;
        }
      };

      /**
       * Handles the touch end event for mobile view.
       * Resets the isTouching flag and checks if the window should be closed based on the drag distance.
       * @param {TouchEvent} event - The touch end event.
       * @param {string} id - The ID of the window component.
       */
      const onTouchEnd = (event, id) => {
        if (!isTouching.value) return;
        isTouching.value = false;

        const deltaY = touchCurrentY.value - touchStartY.value;
        const windowElement = event.currentTarget;

        if (windowElement) {
          // reset the transform style so it opens fully again if the window is not fully closed
          windowElement.style.transform = '';

          // Close if dragged down far enough 1/3 of the window height
          if (deltaY > windowElement.offsetHeight / 3) {
            windowManager.remove(id);
          }
        }
      };

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
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        isOblique,
        xs: display.xs,
      };
    },
  };
</script>
