<template>
  <MenuWrapper
    :value-fallback="{ color: [255, 255, 255, 1] }"
    name="components.style.fill"
    v-bind="{ ...$attrs, ...$props }"
  >
    <template #preview>
      <v-sheet :color="rgbaString" width="100%" height="100%" />
    </template>
    <template #content>
      <VcsFillSelector v-bind="{ ...$attrs, ...$props }" />
    </template>
  </MenuWrapper>
</template>

<script>
  import { computed } from 'vue';
  import { VSheet } from 'vuetify/components';
  import { useProxiedAtomicModel } from '../modelHelper.js';
  import VcsFillSelector from './VcsFillSelector.vue';
  import MenuWrapper from './MenuWrapper.vue';
  import { useColorObject, rgbaObjectToString } from './composables.js';

  /**
   * @description A wrapper for the VcsFillSelector, that has a small color preview and a menu that pops up when clicking the preview, containing the fill selector.
   * When clicking the reset button, the valueDefault is emitted, when unchecking the checkbox in front of the preview, null is emitted.
   * If it is checked again, valueDefault is emitted. If the valueDefault is undefined or null, { color: [255, 255, 255, 1] } is emitted.
   * @vue-prop {import("ol/style/Fill").Options} [modelValue] - The Fill Options
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
    },
    setup(props, { emit }) {
      const localValue = useProxiedAtomicModel(props, 'modelValue', emit);
      const rgbaObject = useColorObject(() => localValue.value?.color);
      return {
        rgbaString: computed(() => rgbaObjectToString(rgbaObject.value)),
      };
    },
  };
</script>

<style scoped></style>
