
<template>
  <div
    id="vcs-popover"
    v-if="popoverComponent"
    class="position-absolute z-index-100"
    :style="{
      left: `${popoverCoordinates.x}px`,
      top: `${popoverCoordinates.y}px`
    }"
  >
    <component
      v-click-outside="onClickOutside"
      :is="popoverComponent"
      @input="popoverCallback"
      v-bind="popoverAttrs"
    />
  </div>
</template>


<script>
  import Vue from 'vue';
  import ClickOutside from 'vue-click-outside';
  import { mapFields } from 'vuex-map-fields';

  import ColorPicker from '@/components/dumb/ColorPicker.vue';
  import FileNamePopover from '@/components/dumb/FileNamePopover.vue';

  /**
   * @description
   * Popover wrapper component. In order to show a popover it must be registered here first.
   * Import and add it to the list of components. Then set store values on click.
   *
   * @example
   *
   * template: '<span @click.stop="showPicker"/>',
   * computed: {
   *   ...mapFields(
   *     'popoverStoreModule',
   *     [
   *       'popoverComponent',
   *       'popoverCoordinates',
   *       'popoverCallback',
   *       'popoverAttrs',
   *     ],
   *   ),
   * },
   * methods: {
   *   showPicker(e) {
   *     const { clientX, clientY } = e;
   *     this.popoverCoordinates = { x: clientX, y: clientY };
   *     this.popoverComponent = 'ColorPicker';
   *     this.popoverAttrs = {
   *       value: this.value?.trim(),
   *     };
   *     const binding = (input) => {
   *       this.$emit('input', input);
   *     };
   *     binding.bind(this);
   *     this.popoverCallback = binding;
   *   }
   * }
   *
   *
   */
  export default Vue.extend({
    name: 'VcsPopover',
    directives: { ClickOutside },
    computed: {
      ...mapFields(
        'popoverStoreModule',
        [
          'popoverComponent',
          'popoverCoordinates',
          'popoverCallback',
          'popoverAttrs',
        ],
      ),
    },
    mounted() {
      document.addEventListener('drop', this.onClickOutside);
    },
    beforeDestroy() {
      document.removeEventListener('drop', this.onClickOutside);
    },
    components: {
      ColorPicker,
      FileNamePopover,
    },
    methods: {
      onClickOutside() {
        this.popoverComponent = undefined;
        this.popoverCoordinates = undefined;
        this.popoverCallback = undefined;
        this.popoverAttrs = undefined;
      },
    },
  });
</script>
