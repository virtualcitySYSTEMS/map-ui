
<template>
  <div
    id="vcs-popover"
    v-if="popover.component"
    class="position-absolute z-index-100"
    :style="{
      left: `${popover.coordinates.x + 50}px`,
      top: `${popover.coordinates.y}px`
    }"
  >
    <component
      v-click-outside="onClickOutside"
      :is="popover.component"
      @input="popover.callback"
      v-bind="{ ...popover }"
    />
  </div>
</template>


<script>
  import Vue from 'vue';
  import ClickOutside from 'vue-click-outside';

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
      popover: {
        type: Object,
        default: () => ({}),
      },
    },
    setup(props, vueContext) {
      const onClickOutside = () => vueContext.emit('close');
      return {
        onClickOutside,
      };
    },
  });
</script>
