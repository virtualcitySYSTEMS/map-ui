<template>
  <div>
    <div
      v-for="windowConfig in windowConfigs"
      :ref="'windowConfigs'"
      :key="windowConfig.id"
      :id="windowConfig.id"
      class="vsc-window v-sheet elevation-3 position-absolute"
      @click="bringViewToTop(windowConfig.id)"
      :style="{
        zIndex: zIndexMap[windowConfig.id],
        left: windowConfig.position.left,
        top: windowConfig.position.top,
        right: windowConfig.position.right,
        bottom: windowConfig.position.bottom,
        width: `${windowConfig.width}px`,
      }"
    >
      <component
        :is="windowConfig.component"
        :window-config="windowConfig"
        :z-index="zIndexMap[windowConfig.id]"
        :z-index-max="zIndexMax"
        :get-ref="getRef"
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
    props: { windowConfig: Object },
    setup(props, context) {
      const destroy$ = new Subject();
      const windowManager = inject('windowManager');
      const popoverManager = inject('popoverManager');
      let onAddedDestroy;

      const {
        state: {
          zIndexMax,
          zIndexMap,
          items: windowConfigs,
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

      /**
       * @param {string} refId
       * @returns {Object}
       */
      const getRef = refId => context.refs.windows.find(({ id }) => id === refId);

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
                  const windowConfig = windowManager.get(windowRef.id);
                  /** Make sure window does not go out of bounds */
                  const coordinates = {
                    left: `${clipX({ width, offsetX: parseInt(windowConfig.position.left, 10) })}px`,
                    top: `${clipY({ height, offsetY: parseInt(windowConfig.position.top, 10) })}px`,
                  };

                  windowManager.setCoordinates(windowConfig.id, coordinates);
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
            () => context.refs.windowConfigs.forEach(r => subscribeToWindowChanges(r)),
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
        windowConfigs,
        zIndexMax,
        zIndexMap,
        close,
        bringViewToTop,
        getRef,
      };
    },
  });
</script>
