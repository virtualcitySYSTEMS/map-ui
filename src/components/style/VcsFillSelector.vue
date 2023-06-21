<template>
  <v-sheet>
    <v-color-picker
      :value="rgbaObject"
      @input="updateColor"
      mode="rgba"
      :hide-mode-switch="true"
      :disabled="!value"
    />
  </v-sheet>
</template>

<script>
  import { VSheet, VColorPicker } from 'vuetify/lib';
  import { useColorObject } from './composables.js';

  /**
   * @description Allows to model a JSON representation of ol/Fill vector style with a vuetify VColorPicker.
   * @vue-prop {import("ol/style/Fill").Options} value - The Fill Options
   */
  export default {
    name: 'VcsFillSelector',
    components: {
      VSheet,
      VColorPicker,
    },
    props: {
      value: {
        type: Object,
        default: undefined,
      },
    },
    setup(props, { emit }) {
      return {
        rgbaObject: useColorObject(() => props.value?.color),
        updateColor(rgba) {
          const fill = {
            color: [rgba.r, rgba.g, rgba.b, rgba.a],
          };
          emit('input', fill);
        },
      };
    },
  };
</script>
