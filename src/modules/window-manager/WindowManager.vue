<template>
  <div>
    <div
      v-for="window in windows"
      :ref="'windows'"
      :key="window.id"
      :id="window.id"
      class="vsc-window v-sheet elevation-3 position-absolute"
      @click="bringViewToTop(window.id)"
      :style="{
        zIndex: zIndexMap[window.id],
        left: window.position.left,
        top: window.position.top,
        right: window.position.right,
        bottom: window.position.bottom,
        width: `${window.width}px`,
      }"
    >
      <component
        :is="window.component"
        :window="window"
        :z-index="zIndexMap[window.id]"
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
  import Window from './Window.vue';


  export default defineComponent({
    name: 'VcsWindowManager',
    components: { Window },
    setup(props, context) {
      const destroy$ = new Subject();
      const windowManager = inject('windowManager');
      const popoverManager = inject('popoverManager');
      const { state: { zIndexMax, zIndexMap, items: windows }, onAdded } = windowManager;
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
      const getRef = (refId) => {
        return context.refs.windows.find(({ id }) => id === refId);
      };

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
                  const window = windowManager.get(windowRef.id);
                  const coordinates = {
                    left: `${clipX({ width, offsetX: parseInt(window.position.left, 10) })}px`,
                    top: `${clipY({ height, offsetY: parseInt(window.position.top, 10) })}px`,
                  };

                  windowManager.setCoordinates(window.id, coordinates);
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
        onAdded.subscribe(
          () => nextTick(
            () => context.refs.windows.forEach(r => subscribeToWindowChanges(r)),
          ),
        );
      });

      onUnmounted(() => {
        destroy$.next();
        destroy$.unsubscribe();
      });

      return {
        windows,
        zIndexMax,
        zIndexMap,
        close,
        bringViewToTop,
        getRef,
      };
    },
  });
</script>
