
<template>
  <div>
    <div
      v-for="(popover) in popoverManager.state.items"
      :key="popover.id"
    >
      <div
        :id="popover.id"
        v-if="popover.component"
        ref="popoverRef"
        class="vcs-popover position-absolute z-index-100"
        :style="{
          left: `${popover.coordinates.x}px`,
          top: `${popover.coordinates.y}px`,
        }"
      >
        <component
          :is="popover.component"
          @input="popover.callback"
          v-bind="{ ...popover }"
        />
      </div>
    </div>
  </div>
</template>


<script>
  import Vue from 'vue';
  import ClickOutside from 'vue-click-outside';
  import { inject, nextTick, onUnmount, ref } from '@vue/composition-api';

  const OFFSET = 16;

  /**
   * @typedef Coordinates
   * @property {number} x
   * @property {number} y
   */
  /**
   * @typedef PopoverConfig
   * @type {Object}
   * @property {string | VueComponent} component
   * @property {Coordinates} coordinates
   * @property {Function} callback
   * @property {string | number} id
   */


  /**
   * @description
   * Popover wrapper component. In order to show a popover it must be registered here first.
   * Import and add it to the list of components. Then set store values on click.
   *
   * @vue-prop {PopoverConfig} popover
   */
  export default Vue.extend({
    name: 'VcsPopoverManager',
    directives: { ClickOutside },
    setup() {
      const popoverRef = ref([]);
      const popoverManager = inject('popoverManager');


      const destroy = popoverManager.onAdded.addEventListener((popover) => {
        nextTick(() => {
          const p = popoverRef.value.find(r => r.id === popover.id);
          const overlayRef = popoverManager.overlayRefs.get(popover.id);
          const { x, y } = overlayRef.getBoundingClientRect();
          popoverManager.setCoordinates(popover, { x, y });
          nextTick(() => {
            const pRect = p.getBoundingClientRect();
            const computedX = (pRect.width + pRect.left + OFFSET) > window.innerWidth ?
              x - pRect.width :
              x + OFFSET;

            const computedY = (pRect.height + pRect.bottom) > window.innerHeight ?
              y - pRect.height :
              y;

            popoverManager.setCoordinates(popover, { x: computedX, y: computedY });
          });
        });
      });

      onUnmount(() => {
        destroy();
      });

      return {
        popoverManager,
        popoverRef,
      };
    },
  });
</script>
