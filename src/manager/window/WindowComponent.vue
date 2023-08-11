<template>
  <v-sheet
    :id="`window-component--${windowState.id}`"
    class="elevation-3 position-absolute d-flex flex-column"
    v-on="{ ...$listeners }"
    @dragstart="dragStart"
    @dragend="dragEnd"
    :draggable="isDraggable"
    :class="{
      rounded: !isDocked,
      marginToTop: isDocked || !isChild,
      'rounded-br': isDynamicLeft,
      'rounded-bl': isDynamicRight,
    }"
  >
    <div
      v-if="!windowState.hideHeader"
      @mousedown="mousedown"
      @mouseup="isDraggable = false"
      class="pa-2"
      :class="{
        'cursor-grab': isDynamic,
        child: isChild,
      }"
    >
      <slot name="headerComponent" :props="$attrs" />
    </div>
    <v-divider v-if="!windowState.hideHeader" />
    <div
      class="overflow-x-hidden mb-1"
      :class="{
        rounded: !isDocked,
      }"
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
  import { computed, inject, provide, ref } from 'vue';
  import { VDivider, VSheet } from 'vuetify/lib';
  import { WindowSlot } from './windowManager.js';

  /**
   * WindowComponent defining the structure and style of VC Map windows
   * @vue-prop {WindowState} windowState
   * @vue-prop {boolean} isOnTop - Whether the component is focused
   * @vue-prop {Object} slotWindow - slot ref of the window
   * @vue-event {PointerEvent} click - raised when the component is clicked
   * @vue-event {MouseEvent} mousedown - raised when the component is mousedown
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
      Object.entries(provides).forEach(([key, value]) => {
        provide(key, value);
      });

      const isChild = computed(() => !!props.windowState.parentId);
      const isDynamic = computed(() => props.slotWindow !== WindowSlot.STATIC);
      const isDocked = computed(() => props.slotWindow !== WindowSlot.DETACHED);
      const isDockedLeft = computed(() => {
        return (
          props.slotWindow === WindowSlot.STATIC ||
          props.slotWindow === WindowSlot.DYNAMIC_LEFT ||
          props.slotWindow === WindowSlot.DYNAMIC_CHILD
        );
      });
      const isDockedRight = computed(
        () => props.slotWindow === WindowSlot.DYNAMIC_RIGHT,
      );
      const isDraggable = ref(false);
      /**
       * Sets window as draggable on mousedown on header.
       * Stops bubbling of header action buttons.
       * @param {MouseEvent} e
       */
      const mousedown = (e) => {
        emit('mousedown', e);
        if (e.target.closest('button')) {
          return;
        }
        isDraggable.value = isDynamic.value;
      };
      /**
       * @type {DragEvent}
       */
      let startEvent;
      /**
       * @param {DragEvent} e
       */
      const dragStart = (e) => {
        if (!isDraggable.value) {
          e.preventDefault();
          e.stopPropagation();
        }
        startEvent = e;
        // set mouse cursor to move
        e.dataTransfer.effectAllowed = 'move';
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
        isDraggable.value = false;
        endEvent.target.parentElement.ondragover = null;
        app.maps.target.ondragover = null;
      };

      return {
        isDynamic,
        isChild,
        isDocked,
        isDynamicLeft: isDockedLeft,
        isDynamicRight: isDockedRight,
        isDraggable,
        dragStart,
        dragEnd,
        mousedown,
      };
    },
  };
</script>
