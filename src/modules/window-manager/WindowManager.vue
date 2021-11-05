<template>
  <div>
    <div
      v-for="wState in windowStates"
      :ref="'windowStates'"
      :key="wState.id"
      :id="wState.id"
      class="vsc-window v-sheet elevation-0 position-absolute"
      @click="bringWindowToTop(wState.id)"
      :style="{
        zIndex: zIndexMap[wState.id],
        left: wState.position.left,
        top: wState.position.top,
        right: wState.position.right,
        bottom: wState.position.bottom,
        width: `${wState.width}px`,
        ...(wState.styles || {})
      }"
    >
      <component
        :is="wState.component"
        :window-id="wState.id"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .vcs-window {
    &__header {
      font-size: 18px;
    }
  }
</style>

<script>
  import {
    defineComponent,
    onMounted,
    onUnmounted,
    nextTick,
    inject,
  } from '@vue/composition-api';
  import { fromEvent, of, Subject } from 'rxjs';
  import Vue from 'vue';
  import {
    debounceTime,
    filter,
    map,
    switchMap,
    take,
    takeUntil,
    tap,
  } from 'rxjs/operators';

  import { clipX, clipY } from './util/clip.js';
  import Window from './WindowComponent.vue';

  export default defineComponent({
    name: 'VcsWindowManager',
    components: { Window },
    props: {
      windowState: {
        type: Object,
        default: () => ({}),
      },
    },
    setup(props, context) {
      /** @type {Map<string, import('rxjs').Subject>} */
      const destroy$ = new Map();
      const windowManager = inject('windowManager');
      const popoverManager = inject('popoverManager');
      let onAddedDestroy;
      let onRemovedDestroy;

      const {
        state: {
          zIndexMax,
          zIndexMap,
          items: windowStates,
        },
        onAdded,
        onRemoved,
      } = windowManager;

      /** @param {string} viewId */
      const bringWindowToTop = (viewId) => {
        windowManager.bringWindowToTop(viewId);
      };
      /** @param {string} viewId */
      const close = (viewId) => {
        windowManager.remove(viewId);
      };


      /** @param {HTMLElement} windowRef */
      const subscribeToWindowChanges = (windowRef) => {
        destroy$.set(windowRef.id, new Subject());
        /** Needed for dragging to workd */
        fromEvent(document.body, 'dragover')
          .pipe(
            tap(e => e.preventDefault()),
            takeUntil(destroy$.get(windowRef.id)),
          )
          .subscribe();

        fromEvent(windowRef, 'dragstart')
          .pipe(
            filter(
              startEvent => !!startEvent.target.classList &&
                !startEvent.target.classList.contains('sortable-drag'),
            ),
            switchMap((startEvent) => {
              const style = window.getComputedStyle(
                windowRef,
                undefined,
              );
              const startLeft =
                parseInt(style.getPropertyValue('left'), 10) - startEvent.clientX;
              const startTop =
                parseInt(style.getPropertyValue('top'), 10) - startEvent.clientY;

              // set dataTransfer for Firefox
              startEvent.dataTransfer.setData('text/html', '');
              const element = startEvent.target;

              if (element && element.getBoundingClientRect) {
                const { width, height } = element.getBoundingClientRect();

                return fromEvent(document.body, 'drop').pipe(
                  take(1),
                  map((dropEvent) => {
                    return {
                      left: startLeft + dropEvent.clientX,
                      top: startTop + dropEvent.clientY,
                      targetWidth: width,
                      targetHeight: height,
                    };
                  }),
                  tap(({ targetWidth, targetHeight, top, left }) => {
                    const windowState = windowManager.get(windowRef.id);
                    popoverManager.removeAllFrom(windowRef);
                    /** Make sure window does not go out of bounds */
                    const coordinates = {
                      left: `${clipX({ width: targetWidth, offsetX: left })}px`,
                      top: `${clipY({ height: targetHeight, offsetY: top })}px`,
                    };

                    windowManager.setCoordinates(windowRef.id, coordinates);
                    windowManager.bringWindowToTop(windowRef.id);
                    nextTick(() => {
                      Vue.set(windowManager.state.items, windowState.id, {
                        ...windowManager.get(windowRef.id),
                        isDetached: true,
                      });
                    });
                  }),
                  takeUntil(destroy$.get(windowRef.id)),
                );
              }

              return of();
            }),
          )
          .subscribe();

        fromEvent(window, 'resize')
          .pipe(
            debounceTime(500),
            tap(() => {
              if (windowRef instanceof HTMLElement) {
                const { innerWidth, innerHeight } = window;
                const { x, y, width, height } = windowRef.getBoundingClientRect();
                if (width + x > innerWidth || height + y > innerHeight) {
                  const windowState = windowManager.get(windowRef.id);
                  /** Make sure window does not go out of bounds */
                  const coordinates = {
                    left: `${clipX({ width, offsetX: parseInt(windowState.position.left, 10) })}px`,
                    top: `${clipY({ height, offsetY: parseInt(windowState.position.top, 10) })}px`,
                  };

                  windowManager.setCoordinates(windowState.id, coordinates);
                }
              }
            }),
            takeUntil(destroy$.get(windowRef.id)),
          )
          .subscribe();
      };


      onMounted(() => {
        /**
         * Important: Access to context.refs is deprecated but it is the only way to
         * get dynamic refs as v2 composition API does not support ref functions.
         * https://github.com/vuejs/composition-api#limitations
         * This needs to be refactored to use ref setter functions as soon as migrated to Vue 3.
         * Tutorial: https://markus.oberlehner.net/blog/refs-and-the-vue-3-composition-api/
         */
        onAddedDestroy = onAdded.addEventListener(
          () => nextTick(
            () => context.refs.windowStates.forEach((r) => {
              if (!windowStates[r.id].windowSlot !== 'static') {
                subscribeToWindowChanges(r);
              }
            }),
          ),
        );

        onRemovedDestroy = onRemoved.addEventListener(
          (windowState) => {
            if (!windowStates[windowState.id].windowSlot !== 'static') {
              destroy$.get(windowState.id.toString()).next();
              destroy$.get(windowState.id.toString()).unsubscribe();
            }
          },
        );
      });

      onUnmounted(() => {
        if (onAddedDestroy) {
          onAddedDestroy();
        }
        if (onRemovedDestroy) {
          onRemovedDestroy();
        }
      });

      return {
        windowStates,
        zIndexMax,
        zIndexMap,
        close,
        bringWindowToTop,
      };
    },
  });
</script>
