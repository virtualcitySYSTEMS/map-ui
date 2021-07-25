<template>
  <div>
    <div
      v-for="windowState in windowStates"
      :ref="'windowStates'"
      :key="windowState.id"
      :id="windowState.id"
      class="vsc-window v-sheet elevation-3 position-absolute"
      @click="bringViewToTop(windowState.id)"
      :style="{
        zIndex: zIndexMap[windowState.id],
        left: windowState.position.left,
        top: windowState.position.top,
        right: windowState.position.right,
        bottom: windowState.position.bottom,
        width: `${windowState.width}px`,
      }"
    >
      <component
        :is="windowState.component"
        :window-state="windowState"
        :z-index="zIndexMap[windowState.id]"
        :z-index-max="zIndexMax"
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
  import {
    debounceTime,
    filter,
    map,
    switchMap,
    take,
    takeUntil,
    tap,
  } from 'rxjs/operators';

  import { clipX, clipY } from './util/clip';
  import Window from './WindowComponent.vue';


  export default defineComponent({
    name: 'VcsWindowManager',
    components: { Window },
    props: { windowState: Object },
    setup(props, context) {
      const destroy$ = new Subject();
      const windowManager = inject('windowManager');
      const popoverManager = inject('popoverManager');
      let onAddedDestroy;

      const {
        state: {
          zIndexMax,
          zIndexMap,
          items: windowStates,
        },
        onAdded,
      } = windowManager;

      /** @param {string} viewId */
      const bringViewToTop = (viewId) => {
        windowManager.bringViewToTop(viewId);
      };
      /** @param {string} viewId */
      const close = (viewId) => {
        windowManager.remove(viewId);
      };

      /** Needed for dragging to workd */
      fromEvent(document.body, 'dragover')
        .pipe(
          tap(e => e.preventDefault()),
          takeUntil(destroy$),
        )
        .subscribe();

      /** @param {HTMLElement} windowRef */
      const subscribeToWindowChanges = (windowRef) => {
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
                    popoverManager.removeAllFrom(windowRef);
                    /** Make sure window does not go out of bounds */
                    const coordinates = {
                      left: `${clipX({ width: targetWidth, offsetX: left })}px`,
                      top: `${clipY({ height: targetHeight, offsetY: top })}px`,
                    };

                    windowManager.setCoordinates(windowRef.id, coordinates);
                    windowManager.bringViewToTop(windowRef.id);
                  }),
                  takeUntil(destroy$),
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
            takeUntil(destroy$),
          )
          .subscribe();
      };


      onMounted(() => {
        /**
         * Important: Access to context.refs is deprecated but it is the only way to
         * get dynamic refs as v2 composition API does not support ref functions.
         * https://github.com/vuejs/composition-api#limitations
         * This needs to be refactored to use ref setter functions as soon as migrated to Vue 3.
         */
        onAddedDestroy = onAdded.addEventListener(
          () => nextTick(
            () => context.refs.windowStates.forEach(r => subscribeToWindowChanges(r)),
          ),
        );
      });

      onUnmounted(() => {
        destroy$.next();
        destroy$.unsubscribe();
        if (onAddedDestroy) {
          onAddedDestroy();
        }
      });

      return {
        windowStates,
        zIndexMax,
        zIndexMap,
        close,
        bringViewToTop,
      };
    },
  });
</script>
