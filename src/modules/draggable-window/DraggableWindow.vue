<template>
  <div
    ref="draggable-window"
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
        'rounded-tr': yPos > 48 && xPos < xMax
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
        <v-icon
          @click="close(viewId)"
          size="16"
          v-text="'mdi-close-thick'"
        />
      </slot>
    </v-sheet>

    <v-sheet
      class="v-sheet elevation-3 overflow-y-auto overflow-x-hidden position-absolute w-full"
      ref="draggable-window__content"
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
  export default {
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
    setup() {
      return {
        destroy$: new Subject(),
      };
    },
    mounted() {
      this.init();

      this.dragSubscription();
      this.dragoverSubscription();
      this.resizeSubscription();
    },
    data() {
      return {
        xPos: 0,
        yPos: 0,
        contentHeight: 0,
      };
    },
    methods: {
      bringToTop(viewId) {
        this.$emit('draggable-window-dropped', viewId);
      },
      close(viewId) {
        this.$emit('draggable-window-closed', viewId);
      },
      init() {
        this.xPos = this.x;
        this.yPos = this.y;
        const contentBox = this.$refs['draggable-window__content'].$el.getBoundingClientRect();
        const distanceFromBottom = -((contentBox.height + contentBox.y) - window.innerHeight);
        this.contentHeight = distanceFromBottom < 0 ?
          (contentBox.height + distanceFromBottom) :
          0;
      },
      dragSubscription() {
        const draggableWindowRef = this.$refs['draggable-window'];
        const self = this;

        fromEvent(draggableWindowRef, 'dragstart').pipe(
          filter(startEvent => !!startEvent.target.classList && !startEvent.target.classList.contains('sortable-drag')),
          switchMap((startEvent) => {
            const style = window.getComputedStyle(draggableWindowRef, undefined);
            const startLeft = parseInt(style.getPropertyValue('left'), 10) - startEvent.clientX;
            const startTop = parseInt(style.getPropertyValue('top'), 10) - startEvent.clientY;


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
                  self.xPos = clipX({ width: targetWidth, offsetX: left });
                  self.yPos = clipY({ height: targetHeight, offsetY: top });

                  self.bringToTop(self.viewId);

                  self.$nextTick(() => {
                    const contentBox = self.$refs['draggable-window__content'].$el.getBoundingClientRect();
                    const distanceFromBottom = -((contentBox.height + contentBox.y) - window.innerHeight);
                    self.contentHeight = distanceFromBottom < 0 ?
                      (contentBox.height + distanceFromBottom) :
                      0;
                  });
                }),
                takeUntil(self.destroy$),
              );
            }

            return of();
          }),
        ).subscribe();
      },
      dragoverSubscription() {
        const self = this;

        fromEvent(document.body, 'dragover').pipe(
          tap((e) => {
            e.preventDefault();
          }),
          takeUntil(self.destroy$),
        ).subscribe();
      },
      resizeSubscription() {
        const draggableWindowRef = this.$refs['draggable-window'];
        const self = this;

        fromEvent(window, 'resize').pipe(
          debounceTime(500),
          tap(() => {
            if (self && draggableWindowRef instanceof HTMLElement) {
              const { innerWidth, innerHeight } = window;
              const { x, y, width, height } = draggableWindowRef.getBoundingClientRect();
              if (width + x > innerWidth || height + y > innerHeight) {
                self.xPos = clipX({ width, offsetX: self.xPos });
                self.yPos = clipY({ height, offsetY: self.yPos });
              }
            }
          }),
          takeUntil(self.destroy$),
        ).subscribe();
      },
    },
    destroyed() {
      this.destroy$.next();
      this.destroy$.unsubscribe();
    },
  };
</script>
