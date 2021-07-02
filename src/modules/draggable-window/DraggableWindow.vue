<template>
  <div>
    <div
      v-for="draggableWindow in draggableWindows"
      :ref="'draggableWindows'"
      :key="draggableWindow.id"
      :id="draggableWindow.id"
      class="vsc-draggable-window v-sheet elevation-3 position-absolute"
      @click="bringViewToTop(draggableWindow.id)"
      :class="[draggableWindow.visible ? 'd-inline-block' : 'd-none']"
      :style="{
        zIndex: draggableWindow.zIndex,
        left: `${draggableWindow.x}px`,
        top: `${draggableWindow.y}px`,
      }"
    >
      <v-sheet
        class="cursor-grab v-sheet d-flex justify-space-between pa-2 transition-color-100-ease"
        :style="{
          width: `${draggableWindow.width}px`,
        }"
        :class="{
          'grey--text': draggableWindow.zIndex < zIndexMax,
          'rounded-tl': draggableWindow.y > 48 && draggableWindow.x > 0,
          'rounded-tr': draggableWindow.y > 48 && draggableWindow.x < (windowWidth - draggableWindow.width),
        }"
        draggable
      >
        <slot name="header">
          <span>
            <slot name="icon">
              <v-icon v-if="draggableWindow.icon" class="mr-2 primary--text" v-text="draggableWindow.icon" />
            </slot>

            <h3 class="font-size-14 d-inline-block">{{ draggableWindow.header | translate }}</h3>
          </span>
        </slot>

        <slot name="close">
          <v-icon @click="close(draggableWindow.id)" size="16" v-text="'mdi-close-thick'" />
        </slot>
      </v-sheet>

      <v-sheet
        class="v-sheet elevation-3 overflow-y-auto overflow-x-hidden position-absolute w-full"
        :style="{
          width: `${draggableWindow.width}px`
        }"
        :class="{
          'rounded-br': draggableWindow.y > 0 && draggableWindow.x < (windowWidth - draggableWindow.width),
          'rounded-bl': draggableWindow.x > 0,
        }"
      >
        <component
          :is="draggableWindow.component"
        />
      </v-sheet>
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
    computed,
    defineComponent,
    onBeforeUpdate,
    onMounted,
    onUnmounted,
    ref,
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

  Vue.use(VueCompositionAPI);

  /**
   * @vue-prop {number} x - Initial x-axis position of the window
   * @vue-prop {number} y - Initial y-axis position of the window
   * @vue-prop {number} width - Width of the window in pixels
   * @vue-prop {string} viewId - Unique id for the window. Should be provided by store
   * @vue-prop {number} zIndex - Z-Index for the window. Should be provided by store
   * @vue-prop {string} icon - Name of Icon which should be shown in top left corner
   * @vue-prop {string} header - Title of the window
   * @vue-prop {string | VueComponent } component - Component which will be displayed
   */
  export default defineComponent({
    name: 'VcsDraggableWindow',
    setup(props, context) {
      const destroy$ = new Subject();
      const draggableWindowManager = inject('draggableWindowManager');
      const popoverManager = inject('popoverManager');
      const { draggableWindowHighestIndex } = draggableWindowManager.state;
      const draggableWindows = draggableWindowManager.state.items;
      const draggableWindowRefs = ref([]);
      const contentHeight = ref(0);
      const windowWidth = computed(() => window.innerWidth);
      /**
       * @param {string} viewId
       * @returns {void}
       */
      const bringViewToTop = viewId => draggableWindowManager.bringViewToTop(viewId);
      /**
       * @param {string} viewId
       * @returns {void}
       */
      const close = viewId => draggableWindowManager.toggleViewVisible(viewId);

      onBeforeUpdate(() => {
        draggableWindowRefs.value = [];
      });


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
                      x: clipX({ width: targetWidth, offsetX: left }),
                      y: clipY({ height: targetHeight, offsetY: top }),
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
                    x: clipX({ width, offsetX: draggableWindow.x }),
                    y: clipY({ height, offsetY: draggableWindow.y }),
                  };

                  draggableWindowManager.setCoordinates(draggableWindow.id, coordinates);
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
         * This needs to be refactored to use ref setter functions aas soon as migrated to v3.
         */
        context.refs.draggableWindows
          .forEach(draggableWindowRef => subscribeToWindowChanges(draggableWindowRef));
      });

      onUnmounted(() => {
        destroy$.next();
        destroy$.unsubscribe();
      });

      return {
        windowWidth,
        contentHeight,
        draggableWindows,
        draggableWindowRefs,
        zIndexMax: draggableWindowHighestIndex,
        close,
        bringViewToTop,
      };
    },
  });
</script>
