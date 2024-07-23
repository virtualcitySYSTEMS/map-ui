<template>
  <v-color-picker
    :model-value="rgbaObject"
    @update:model-value="updateColor"
    mode="rgba"
    :disabled="!modelValue"
    width="100%"
  />
</template>

<script>
  import { VColorPicker } from 'vuetify/components';
  import { useColorObject } from './composables.js';
  import { useProxiedComplexModel } from '../modelHelper.js';

  /**
   * @description Allows to model a JSON representation of ol/Fill vector style with a vuetify VColorPicker.
   * @vue-prop {import("ol/style/Fill").Options} [modelValue] - The Fill Options
   */
  export default {
    name: 'VcsFillSelector',
    components: {
      VColorPicker,
    },
    props: {
      modelValue: {
        type: Object,
        default: undefined,
      },
    },
    setup(props, { emit }) {
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);
      return {
        rgbaObject: useColorObject(() => localValue.value?.color),
        updateColor(rgba) {
          localValue.value.color = [rgba.r, rgba.g, rgba.b, rgba.a];
        },
      };
    },
  };
</script>
