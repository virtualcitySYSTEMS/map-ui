<template>
  <v-color-picker
    class="vcs-fill-selector"
    :model-value="rgbaObject"
    @update:model-value="updateColor"
    mode="rgba"
    :disabled="!modelValue"
    width="100%"
  />
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent } from 'vue';
  import { VColorPicker } from 'vuetify/components';
  import type { Options as FillOptions } from 'ol/style/Fill.js';
  import { useColorObject } from './composables.js';
  import { useProxiedComplexModel } from '../modelHelper.js';

  /**
   * @description Allows to model a JSON representation of ol/Fill vector style with a vuetify VColorPicker.
   * @vue-prop {import("ol/style/Fill").Options} [modelValue] - The Fill Options
   */
  export default defineComponent({
    name: 'VcsFillSelector',
    components: {
      VColorPicker,
    },
    props: {
      modelValue: {
        type: Object as PropType<FillOptions>,
        default: () => ({}),
      },
    },
    setup(props, { emit }) {
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);
      return {
        rgbaObject: useColorObject(() => localValue.value?.color),
        updateColor(rgba: {
          r: number;
          g: number;
          b: number;
          a: number;
        }): void {
          // Ensures alpha is not null, e.g. when the color is set by the user by pastying a color code.
          localValue.value.color = [rgba.r, rgba.g, rgba.b, rgba.a ?? 1];
        },
      };
    },
  });
</script>
