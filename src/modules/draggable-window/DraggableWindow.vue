<template>
  <div
    ref="draggableWindowRef"
    class="vsc-draggable-window v-sheet elevation-3 d-inline-block position-absolute"
    @click="bringToTop(viewId)"
    :style="{
      zIndex: `${zIndex}`,
      left: `${xPos}px`,
      top: `${yPos}px`,
    }"
  >
    <v-sheet
      ref="draggable-window__header"
      class="cursor-grab v-sheet d-flex justify-space-between pa-2 transition-color-100-ease"
      :style="{
        width: `${width}px`,
      }"
      :class="{
        'grey--text': zIndex < zIndexMax,
        'rounded-tl': yPos > 48 && xPos > 0,
        'rounded-tr': yPos > 48 && xPos < xMax,
      }"
      draggable
    >
      <slot name="header">
        <span>
          <slot name="icon">
            <v-icon v-if="icon" class="mr-2 primary--text" v-text="icon" />
          </slot>

          <h3 class="font-size-14 d-inline-block">{{ header }}</h3>
        </span>
      </slot>

      <slot name="close">
        <v-icon @click="close(viewId)" size="16" v-text="'mdi-close-thick'" />
      </slot>
    </v-sheet>

    <v-sheet
      class="v-sheet elevation-3 overflow-y-auto overflow-x-hidden position-absolute w-full"
      ref="draggableWindowContent"
      :style="{
        width: `${width}px`,
        maxHeight: contentHeight ? `${contentHeight}px` : undefined,
      }"
      :class="{
        'rounded-br': yPos > 0 && xPos < xMax,
        'rounded-bl': xPos > 0,
      }"
    >
      <slot />
    </v-sheet>
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
    ref,
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
   * @vue-prop {number} zIndexMax - Max z-Index for all windows. Should be provided by store
   * @vue-prop {string} icon - Name of Icon which should be shown in top left corner
   * @vue-prop {string} header - Title of the window
   */
  export default defineComponent({
    name: 'VcsDraggableWindow',
    computed: {
      xMax() {
        return window.innerWidth - this.width;
      },
    },
    props: {
      x: {
        type: Number,
        default: 0,
      },
      y: {
        type: Number,
        default: 0,
      },
      width: {
        type: Number,
        default: 280,
      },
      viewId: {
        type: String,
        default: undefined,
      },
      zIndex: {
        type: Number,
        default: 4,
      },
      zIndexMax: {
        type: Number,
        default: 50,
      },
      icon: {
        type: String,
        default: '',
      },
      header: {
        type: String,
        default: undefined,
      },
    },
    setup(props, context) {
      const draggableWindowRef = ref();
      const yPos = ref(props.y);
      const xPos = ref(props.x);
      const destroy$ = new Subject();
      const draggableWindowContent = ref();
      const contentHeight = ref(0);

      const bringToTop = (viewId) => {
        context.emit('draggable-window-dropped', viewId);
      };
      const close = (viewId) => {
        context.emit('draggable-window-closed', viewId);
      };

      fromEvent(document.body, 'dragover')
        .pipe(
          tap((e) => {
            e.preventDefault();
          }),
          takeUntil(destroy$),
        )
        .subscribe();

      const dragSubscription = () => {
        fromEvent(draggableWindowRef.value, 'dragstart')
          .pipe(
            filter(
              startEvent => !!startEvent.target.classList &&
                !startEvent.target.classList.contains('sortable-drag'),
            ),
            switchMap((startEvent) => {
              const style = window.getComputedStyle(
                draggableWindowRef.value,
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
                    xPos.value = clipX({ width: targetWidth, offsetX: left });
                    yPos.value = clipY({ height: targetHeight, offsetY: top });

                    bringToTop(props.viewId);
                  }),
                  takeUntil(destroy$),
                );
              }

              return of();
            }),
          )
          .subscribe();
      };

      fromEvent(window, 'resize')
        .pipe(
          debounceTime(500),
          tap(() => {
            if (draggableWindowRef.value instanceof HTMLElement) {
              const { innerWidth, innerHeight } = window;
              const {
                x,
                y,
                width,
                height,
              } = draggableWindowRef.value.getBoundingClientRect();
              if (width + x > innerWidth || height + y > innerHeight) {
                xPos.value = clipX({ width, offsetX: xPos.value });
                yPos.value = clipY({ height, offsetY: yPos.value });
              }
            }
          }),
          takeUntil(destroy$),
        )
        .subscribe();

      onMounted(() => {
        dragSubscription();
      });

      return {
        yPos,
        xPos,
        contentHeight,
        draggableWindowRef,
        draggableWindowContent,
        close,
        bringToTop,
      };
    },
  });
</script>
