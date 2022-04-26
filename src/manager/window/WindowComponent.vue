<template>
  <div
    :id="`window-component--${windowState.id}`"
    class="vsc-window v-sheet elevation-0 position-absolute"
    ref="windowComponentRef"
    @click="clicked"
  >
    <v-sheet
      v-if="!windowState.hideHeader"
      ref="draggableHeaderRef"
      class="v-sheet elevation-3 pa-2 transition-color-100-ease"
      :class="{
        'cursor-grab': isDynamic,
        'grey--text': !isOnTop,
        'rounded-tl': !isDocked,
        'rounded-tr': !isDocked,
      }"
      :draggable="isDynamic"
    >
      <slot name="headerComponent" />
    </v-sheet>
    <v-sheet
      class="v-sheet elevation-3 overflow-y-auto overflow-x-hidden w-full h-full"
      :class="{
        'rounded-br': !isDocked,
        'rounded-bl': !isDocked,
      }"
    >
      <slot />
    </v-sheet>
  </div>
</template>

<script>
  import {
    onMounted, onUnmounted, computed, ref, nextTick,
  } from '@vue/composition-api';
  import { fromEvent } from 'rxjs';
  import { switchMap, take, map, tap } from 'rxjs/operators';
  import { WindowSlot } from './windowManager.js';

  export default {
    props: {
      windowState: {
        type: Object,
        required: true,
      },
      isOnTop: {
        type: Boolean,
        required: true,
        default: false,
      },
      slotWindow: {
        type: Object,
        required: true,
      },
    },
    setup({ windowState, slotWindow }, { emit }) {
      const draggableHeaderRef = ref(null);
      const windowComponentRef = ref(null);
      const isDynamic = computed(() => slotWindow.value !== WindowSlot.STATIC);
      const isDocked = computed(() => slotWindow.value !== WindowSlot.DETACHED);
      const clicked = (e) => {
        emit('click', e);
      };

      let dragOverSub;
      let dropSub;
      onMounted(() => {
        if (!windowState.hideHeader && slotWindow.value !== WindowSlot.STATIC) {
          nextTick(() => {
            // To get to the Root Element of a Custom Component .$el is used here.
            const dragStart = fromEvent(draggableHeaderRef.value.$el, 'dragstart');
            const dragOver = fromEvent(document.body, 'dragover');
            const drop = fromEvent(document.body, 'drop');
            const dragThenDrop = dragStart.pipe(
              tap(() => {
                dragOverSub = dragOver.subscribe((e) => {
                  // make it accepting drop events
                  // TODO check if setting the position here works.
                  e.preventDefault();
                });
              }),
              switchMap((startEvent) => {
                const style = window.getComputedStyle(windowComponentRef.value, null);
                const windowPosition = {
                  top: parseInt(style.getPropertyValue('top'), 10),
                  left: parseInt(style.getPropertyValue('left'), 10),
                  width: parseInt(style.getPropertyValue('width'), 10),
                  height: parseInt(style.getPropertyValue('height'), 10),
                };
                // set dataTransfer for Firefox
                startEvent.dataTransfer.setData('text/html', null);

                return drop.pipe(
                  take(1),
                  map((dropEvent) => {
                    windowPosition.dx = startEvent.clientX - dropEvent.clientX;
                    windowPosition.dy = startEvent.clientY - dropEvent.clientY;
                    return windowPosition;
                  }),
                  tap(() => {
                    dragOverSub.unsubscribe();
                  }),
                );
              }),
            );
            dropSub = dragThenDrop.subscribe((pos) => {
              emit('dropped', pos);
            });
          });
        }
      });

      onUnmounted(() => {
        if (dragOverSub) {
          dragOverSub.unsubscribe();
        }
        if (dropSub) {
          dropSub.unsubscribe();
        }
      });
      return {
        isDynamic,
        isDocked,
        draggableHeaderRef,
        windowComponentRef,
        clicked,
      };
    },
  };
</script>

