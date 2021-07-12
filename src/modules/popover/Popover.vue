
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
          left: `${getLeft(popover)}px`,
          top: `${popover.coordinates.y}px`,
          display: popover.visible ? 'block' : 'none'
        }"
      >
        <component
          :v-if="popover.visible"
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
  import VueCompositionAPI, { inject, ref } from '@vue/composition-api';

  Vue.use(VueCompositionAPI);

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
    name: 'VcsPopover',
    directives: { ClickOutside },
    setup() {
      const popoverRef = ref([]);
      const popoverManager = inject('popoverManager');

      const getLeft = (popover) => {
        const thisRef = popoverRef.value.find(p => p.id === popover.id);
        if (!thisRef) {
          return popover.coordinates.x + 24;
        }
        const { width, left } = thisRef.getBoundingClientRect();
        return (width + left) > window.innerWidth ? left - width - 24 :
          popover.coordinates.x + 24;
      };

      return {
        popoverManager,
        popoverRef,
        getLeft,
      };
    },
  });
</script>
