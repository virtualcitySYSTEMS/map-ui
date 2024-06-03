<template>
  <v-sheet>
    <v-color-picker
      :model-value="rgbaObject"
      @update:model-value="updateColor"
      mode="rgba"
      :disabled="!value"
    />
  </v-sheet>
</template>

<script>
  import { VSheet, VColorPicker } from 'vuetify/components';
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
      modelValue: {
        type: Object,
        default: undefined,
      },
    },
    setup(props, { emit }) {
      return {
        rgbaObject: useColorObject(() => props.modelValue?.color),
        updateColor(rgba) {
          const fill = {
            color: [rgba.r, rgba.g, rgba.b, rgba.a],
          };
          emit('update:modelValue', fill);
        },
      };
    },
  };
</script>
