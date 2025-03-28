<template>
  <v-sheet
    :id="`window-component--${windowState.id}`"
    class="elevation-3 position-absolute d-flex flex-column window-component"
    v-bind="$attrs"
    @dragstart="dragStart"
    @dragend="dragEnd"
    :draggable="isDraggable"
    :class="{
      rounded: !isDocked,
      marginToTop: isDocked || !isChild,
      marginTablet: isTabletWithOpenToolbar,
      'rounded-be': isDynamicLeft,
      'rounded-bs': isDynamicRight,
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
      class="overflow-x-hidden overflow-y-auto mb-1 d-flex flex-grow-1 flex-column"
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
  .marginTablet {
    margin-top: calc(var(--v-vcs-font-size) * 3 + 6px);
    margin-bottom: 2px;
  }
</style>

<script>
  import { computed, inject, provide, ref } from 'vue';
  import { VDivider, VSheet } from 'vuetify/components';
  import { useDisplay } from 'vuetify';
  import { WindowSlot } from './windowManager.js';

  /**
   * @description WindowComponent defining the structure and style of VC Map windows
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
    inheritAttrs: false,
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
      const isDynamic = computed(
        () => props.slotWindow.value !== WindowSlot.STATIC,
      );
      const isDocked = computed(
        () => props.slotWindow.value !== WindowSlot.DETACHED,
      );
      const display = useDisplay();
      const isTabletWithOpenToolbar = computed(
        () => app.toolboxManager.open.value && display.sm.value,
      );
      const isDockedLeft = computed(() => {
        return (
          props.slotWindow.value === WindowSlot.STATIC ||
          props.slotWindow.value === WindowSlot.DYNAMIC_LEFT ||
          props.slotWindow.value === WindowSlot.DYNAMIC_CHILD
        );
      });
      const isDockedRight = computed(
        () => props.slotWindow.value === WindowSlot.DYNAMIC_RIGHT,
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
        } else {
          startEvent = e;
          // set mouse cursor to move
          e.dataTransfer.effectAllowed = 'move';
        }
      };
      /**
       * @param {DragEvent} endEvent
       */
      const dragEnd = (endEvent) => {
        if (isDraggable.value) {
          const movement = {
            dx: endEvent.clientX - startEvent.clientX,
            dy: endEvent.clientY - startEvent.clientY,
          };
          emit('moved', movement);
          startEvent = null;
          isDraggable.value = false;
          endEvent.target.parentElement.ondragover = null;
          app.maps.target.ondragover = null;
        }
      };

      return {
        isDynamic,
        isChild,
        isDocked,
        isTabletWithOpenToolbar,
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
