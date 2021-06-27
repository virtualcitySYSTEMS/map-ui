
<template>
  <div>
    <div
      v-for="(popover, i) in popoverManager.state.items"
      :key="i"
    >
      <div
        id="vcs-popover"
        v-if="popover.component"
        class="position-absolute z-index-100"
        :style="{
          left: `${popover.coordinates.x + 24}px`,
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
  import VueCompositionAPI from '@vue/composition-api';

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
    props: {
      popoverManager: {
        type: Object,
        required: true,
      },
    },
  });
</script>
