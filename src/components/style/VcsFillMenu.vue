<template>
  <MenuWrapper
    v-bind="{ ...$attrs, modelValue, valueDefault, disabled }"
    :value-fallback="{ color: [255, 255, 255, 1] }"
    name="components.style.fill"
  >
    <template #preview>
      <v-sheet :color="rgbaString" width="100%" height="100%" />
    </template>
    <template #content>
      <VcsFillSelector :model-value="modelValue" v-bind="$attrs" />
    </template>
  </MenuWrapper>
</template>

<script>
  import { computed } from 'vue';
  import { VSheet } from 'vuetify/components';
  import VcsFillSelector from './VcsFillSelector.vue';
  import MenuWrapper from './MenuWrapper.vue';
  import { useColorObject, rgbaObjectToString } from './composables.js';

  /**
   * @description A wrapper for the VcsFillSelector, that has a small color preview and a menu that pops up when clicking the preview, containing the fill selector.
   * When clicking the reset button, the valueDefault is emitted, when unchecking the checkbox in front of the preview, null is emitted. If it is checked again, valueDefault is emitted. If the valueDefault is undefined or null, { color: [255, 255, 255, 1] } is emitted.
   * @vue-prop {import("ol/style/Fill").Options} [value] - The Fill Options
   * @vue-prop {import("ol/style/Fill").Options} [valueDefault] - The default Fill Options
   * @vue-prop {boolean} [disabled=false] - Disable the input
   */
  export default {
    name: 'VcsFillMenu',
    components: {
      VSheet,
      VcsFillSelector,
      MenuWrapper,
    },
    props: {
      modelValue: {
        type: Object,
        default: undefined,
      },
      valueDefault: {
        type: Object,
        default: undefined,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      const rgbaObject = useColorObject(() => props.modelValue?.color);
      return {
        rgbaString: computed(() => rgbaObjectToString(rgbaObject.value)),
      };
    },
  };
</script>

<style scoped></style>
