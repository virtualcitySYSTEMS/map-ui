<template>
  <MenuWrapper
    v-bind="{ ...$attrs, modelValue, valueDefault }"
    :value-fallback="fallbackStyle"
    name="components.style.text"
  >
    <template #preview>
      <div v-if="modelValue" class="d-flex justify-center align-center">
        <span id="text-preview">T</span>
      </div>
    </template>
    <template #content>
      <VcsTextSelector v-bind="{ ...$attrs, modelValue, valueDefault }" />
    </template>
  </MenuWrapper>
</template>

<script>
  import { computed } from 'vue';
  import VcsTextSelector from './VcsTextSelector.vue';
  import MenuWrapper from './MenuWrapper.vue';
  import { rgbaObjectToString, useColorObject } from './composables.js';

  export const fallbackStyle = {
    font: '10px Arial, Helvetica, sans-serif',
    fill: { color: [0, 0, 0, 1] },
    stroke: { color: [255, 255, 255, 1], width: 2 },
    offsetX: 0,
    offsetY: 0,
  };

  /**
   * @description A wrapper for the VcsTextSelector, that has a small shape/icon preview and a menu that pops up when clicking the preview, containing the text style selector.
   * @vue-prop {import("ol/style/Text").Options} value - The ol Text style options
   * @vue-prop {import("ol/style/Text").Options} valueDefault - The default ol Text style options
   */
  export default {
    name: 'VcsTextMenu',
    components: {
      MenuWrapper,
      VcsTextSelector,
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
    },
    setup(props) {
      const fillColorObject = useColorObject(
        () => props.modelValue?.fill?.color,
      );
      const strokeColorObject = useColorObject(
        () => props.modelValue?.stroke?.color,
      );

      return {
        strokeColor: computed(() =>
          rgbaObjectToString(strokeColorObject.value),
        ),
        fillColor: computed(() => rgbaObjectToString(fillColorObject.value)),
        fontStyle: computed(() => props.modelValue?.font),
        fallbackStyle,
      };
    },
  };
</script>

<style>
  #text-preview {
    font: v-bind(fontStyle) !important;
    font-size: 20px !important;
    -webkit-text-stroke-color: v-bind(strokeColor);
    -webkit-text-stroke-width: 1px;
    -webkit-text-fill-color: v-bind(fillColor);
    line-height: 1;
  }
</style>
