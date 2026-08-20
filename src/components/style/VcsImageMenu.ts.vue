<script setup lang="ts">
  import type { ImageStyleOptions } from '@vcmap/core';
  import { onMounted, ref, watch } from 'vue';
  import type { PropType } from 'vue';
  import { useProxiedAtomicModel } from '../modelHelper.js';
  import StyleMenuWrapper from './StyleMenuWrapper.ts.vue';
  import VcsImageSelector from './VcsImageSelector.ts.vue';
  import { drawImageStyle } from './composables.js';

  /**
   * @description A wrapper for the VcsImageSelector, that has a small shape/icon preview and a menu that pops up when clicking the preview, containing the image selector.
   * @vue-prop {import("ol/style/RegularShape").Options | import("ol/style/Circle").Options | import("ol/style/Icon").Options} [modelValue] - The Image options
   */
  const props = defineProps({
    modelValue: {
      type: Object as PropType<ImageStyleOptions>,
      default: undefined,
    },
  });

  const canvas = ref<HTMLCanvasElement | null>(null);
  const emit = defineEmits(['update:modelValue']);
  const localValue = useProxiedAtomicModel(props, 'modelValue', emit);

  onMounted(async () => {
    if (canvas.value) {
      await drawImageStyle(canvas.value, localValue.value, true);
    }
    watch(
      () => props.modelValue,
      async () => {
        if (canvas.value) {
          await drawImageStyle(canvas.value, localValue.value, true);
        }
      },
      { deep: true },
    );
  });
</script>

<template>
  <StyleMenuWrapper
    class="vcs-image-menu"
    :value-fallback="{
      radius: 10,
      fill: { color: [255, 255, 255, 1] },
      stroke: { color: [0, 0, 0, 1], width: 2 },
    }"
    name="components.style.image"
    v-bind="$attrs"
    v-model="localValue"
  >
    <template #preview>
      <canvas ref="canvas" width="32" height="24" />
    </template>
    <template #content>
      <VcsImageSelector v-bind="$attrs" v-model="localValue" class="pb-2" />
    </template>
  </StyleMenuWrapper>
</template>

<style scoped></style>
