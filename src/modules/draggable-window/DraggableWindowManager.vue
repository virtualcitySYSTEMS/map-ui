<template>
  <div>
    <div
      v-for="draggableWindow in draggableWindows"
      :ref="'draggableWindows'"
      :key="draggableWindow.id"
      :id="draggableWindow.id"
      class="vsc-draggable-window v-sheet elevation-3 position-absolute"
      @click="bringViewToTop(draggableWindow.id)"
      :style="{
        zIndex: zIndexMap[draggableWindow.id],
        left: draggableWindow.position.left,
        top: draggableWindow.position.top,
        right: draggableWindow.position.right,
        bottom: draggableWindow.position.bottom,
      }"
    >
      <component
        :is="draggableWindow.component"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .vcs-draggable-window {
    &__header {
      font-size: 18px;
    }
  }
</style>

<script>
  import Vue from 'vue';
  import VueCompositionAPI, {
    defineComponent,
    onMounted,
    onUnmounted,
    nextTick,
    inject,
    watch,
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
  import DraggableWindow from './DraggableWindow.vue';

  Vue.use(VueCompositionAPI);

  export default defineComponent({
    name: 'VcsDraggableWindowManager',
    components: { DraggableWindow },
    setup(props, context) {
      const destroy$ = new Subject();
      const draggableWindowManager = inject('draggableWindowManager');
      const popoverManager = inject('popoverManager');
      const { state: { zIndexMax, zIndexMap, items: draggableWindows }, onAdded } = draggableWindowManager;
      /**
       * @param {string} viewId
       */
      const bringViewToTop = (viewId) => {
        draggableWindowManager.bringViewToTop(viewId);
      };
      /**
       * @param {string} viewId
       */
      const close = (viewId) => {
        draggableWindowManager.remove(viewId);
      };


      fromEvent(document.body, 'dragover')
        .pipe(
          tap(e => e.preventDefault()),
          takeUntil(destroy$),
        )
        .subscribe();

      /**
       * @param {HTMLElement} draggableWindowRef
       */
      const subscribeToWindowChanges = (draggableWindowRef) => {
        fromEvent(draggableWindowRef, 'dragstart')
          .pipe(
            filter(
              startEvent => !!startEvent.target.classList &&
                !startEvent.target.classList.contains('sortable-drag'),
            ),
            switchMap((startEvent) => {
              const style = window.getComputedStyle(
                draggableWindowRef,
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
                    const coordinates = {
                      left: `${clipX({ width: targetWidth, offsetX: left })}px`,
                      top: `${clipY({ height: targetHeight, offsetY: top })}px`,
                    };

                    draggableWindowManager.setCoordinates(draggableWindowRef.id, coordinates);
                    draggableWindowManager.bringViewToTop(draggableWindowRef.id);

                    nextTick(() => popoverManager.updateCoordinates());
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
              if (draggableWindowRef instanceof HTMLElement) {
                const { innerWidth, innerHeight } = window;
                const { x, y, width, height } = draggableWindowRef.getBoundingClientRect();
                if (width + x > innerWidth || height + y > innerHeight) {
                  const draggableWindow = draggableWindowManager.get(draggableWindowRef.id);
                  const coordinates = {
                    left: `${clipX({ width, offsetX: parseInt(draggableWindow.position.left, 10) })}px`,
                    top: `${clipY({ height, offsetY: parseInt(draggableWindow.position.top, 10) })}px`,
                  };

                  draggableWindowManager.setCoordinates(draggableWindow.id, coordinates);
                }
              }
            }),
            takeUntil(destroy$),
          )
          .subscribe();
      };

      onAdded.subscribe(d => nextTick(console.log(context.refs, draggableWindows)));


      onMounted(() => {
        /**
         * Important: Access to context.refs is deprecated but it is the only way to
         * get dynamic refs as v2 composition API does not support ref functions.
         * https://github.com/vuejs/composition-api#limitations
         * This needs to be refactored to use ref setter functions as soon as migrated to Vue 3.
         */
        // context.refs.draggableWindows
        //   .forEach(draggableWindowRef => subscribeToWindowChanges(draggableWindowRef));
      });

      onUnmounted(() => {
        destroy$.next();
        destroy$.unsubscribe();
      });

      return {
        draggableWindows,
        zIndexMax,
        zIndexMap,
        close,
        bringViewToTop,
      };
    },
  });
</script>
