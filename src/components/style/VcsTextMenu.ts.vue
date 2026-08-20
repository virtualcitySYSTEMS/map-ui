<script setup lang="ts">
  import { computed } from 'vue';
  import type { PropType } from 'vue';
  import { useProxiedAtomicModel } from '../modelHelper.js';
  import VcsTextSelector from './VcsTextSelector.ts.vue';
  import StyleMenuWrapper from './StyleMenuWrapper.ts.vue';
  import { rgbaObjectToString, useColorObject } from './composables.js';
  import type { TextStyleOptions } from './composables.js';
  /**
   * @description A wrapper for the VcsTextSelector, that has a small shape/icon preview and a menu that pops up when clicking the preview, containing the text style selector.
   * @vue-prop {import("ol/style/Text").Options} [modelValue] - The ol Text style options
   */
  const props = defineProps({
    modelValue: {
      type: Object as PropType<TextStyleOptions>,
      default: undefined,
    },
  });
  const emit = defineEmits(['update:modelValue']);

  const fallbackStyle = {
    font: '10px Arial, Helvetica, sans-serif',
    fill: { color: [0, 0, 0, 1] },
    stroke: { color: [255, 255, 255, 1], width: 2 },
    offsetX: 0,
    offsetY: 0,
  };

  const localValue = useProxiedAtomicModel(props, 'modelValue', emit);
  const fillColorObject = useColorObject(() => localValue.value?.fill?.color);
  const strokeColorObject = useColorObject(
    () => localValue.value?.stroke?.color,
  );

  const strokeColor = computed(() =>
    rgbaObjectToString(strokeColorObject.value),
  );
  const fillColor = computed(() => rgbaObjectToString(fillColorObject.value));
  const fontStyle = computed(() => localValue.value?.font);
</script>

<template>
  <StyleMenuWrapper
    class="vcs-text-menu"
    :value-fallback="fallbackStyle"
    name="components.style.text"
    v-bind="$attrs"
    v-model="localValue"
  >
    <template #preview>
      <div v-if="modelValue" class="d-flex justify-center align-center">
        <span class="vcs-text-menu-preview">T</span>
      </div>
    </template>
    <template #content>
      <VcsTextSelector v-bind="$attrs" v-model="localValue" />
    </template>
  </StyleMenuWrapper>
</template>

<style>
  .vcs-text-menu-preview {
    font: v-bind(fontStyle) !important;
    font-size: 20px !important;
    -webkit-text-stroke-color: v-bind(strokeColor);
    -webkit-text-stroke-width: 1px;
    -webkit-text-fill-color: v-bind(fillColor);
    line-height: 1;
  }
</style>
