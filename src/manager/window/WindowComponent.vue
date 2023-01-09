<template>
  <v-sheet
    :id="`window-component--${windowState.id}`"
    class="elevation-3 position-absolute d-flex flex-column"
    @click="clicked"
    @dragstart="dragStart"
    @dragend="dragEnd"
    :draggable="isDynamic"
    :class="{
      'rounded': !isDocked,
      'marginToTop': isDocked
    }"
  >
    <div
      v-if="!windowState.hideHeader"
      class="pa-2"
      :class="{
        'cursor-grab': isDynamic,
        'grey--text': !isOnTop,
      }"
    >
      <slot name="headerComponent" :props="$attrs" />
    </div>
    <v-divider />
    <div
      class="overflow-x-hidden"
    >
      <slot />
    </div>
  </v-sheet>
</template>

<style scoped>

 .marginToTop {
   margin-top: 2px;
 }

</style>

<script>
  import {
    computed, inject, provide,
  } from 'vue';
  import { VDivider, VSheet } from 'vuetify/lib';
  import { WindowSlot } from './windowManager.js';

  /**
   * WindowComponent defining the structure and style of VC Map windows
   * @vue-prop {WindowState} windowState
   * @vue-prop {boolean} isOnTop - Whether the component is focused
   * @vue-prop {Object} slotWindow - slot ref of the window
   * @vue-event {PointerEvent} clicked - raised when the component is clicked
   * @vue-event {{dx: number, dy: number}} move - raised when the component is moved (dragged)
   * @vue-data {slot} [#default] - slot with the window content
   * @vue-data {slot} [#headerComponent] - slot to override the default header
   */
  export default {
    name: 'WindowComponent',
    components: {
      VSheet,
      VDivider,
    },
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
    setup(props, { emit }) {
      const app = inject('vcsApp');
      const { provides } = app.windowManager.get(props.windowState.id);
      Object.entries(provides)
        .forEach(([key, value]) => {
          provide(key, value);
        });

      const isDynamic = computed(() => props.slotWindow !== WindowSlot.STATIC);
      const isDocked = computed(() => props.slotWindow !== WindowSlot.DETACHED);
      /**
       * @param {PointerEvent} e
       */
      const clicked = (e) => {
        emit('click', e);
      };
      /**
       * @type {DragEvent}
       */
      let startEvent;
      /**
       * @param {DragEvent} e
       */
      const dragStart = (e) => {
        startEvent = e;
      };
      /**
       * @param {DragEvent} endEvent
       */
      const dragEnd = (endEvent) => {
        const movement = {
          dx: endEvent.clientX - startEvent.clientX,
          dy: endEvent.clientY - startEvent.clientY,
        };
        emit('moved', movement);
        startEvent = null;
      };

      return {
        isDynamic,
        isDocked,
        clicked,
        dragStart,
        dragEnd,
      };
    },
  };
</script>

