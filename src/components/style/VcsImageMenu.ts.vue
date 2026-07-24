<template>
  <StyleMenuWrapper
    class="vcs-image-menu"
    :value-fallback="{
      radius: 10,
      fill: { color: [255, 255, 255, 1] },
      stroke: { color: [0, 0, 0, 1], width: 2 },
    }"
    name="components.style.image"
    v-bind="{ ...$attrs, ...$props }"
  >
    <template #preview>
      <canvas ref="canvas" width="32" height="24" />
    </template>
    <template #content>
      <VcsImageSelector v-bind="{ ...$attrs, ...$props }" class="pb-2" />
    </template>
  </StyleMenuWrapper>
</template>

<script lang="ts">
  import type { ImageStyleOptions } from '@vcmap/core';
  import { defineComponent, onMounted, ref, watch } from 'vue';
  import type { PropType } from 'vue';
  import { useProxiedAtomicModel } from '../modelHelper.js';
  import StyleMenuWrapper from './StyleMenuWrapper.ts.vue';
  import VcsImageSelector, { drawImageStyle } from './VcsImageSelector.ts.vue';

  /**
   * @description A wrapper for the VcsImageSelector, that has a small shape/icon preview and a menu that pops up when clicking the preview, containing the image selector.
   * @vue-prop {import("ol/style/RegularShape").Options | import("ol/style/Circle").Options | import("ol/style/Icon").Options} [modelValue] - The Image options
   */
  export default defineComponent({
    name: 'VcsImageMenu',
    components: {
      StyleMenuWrapper,
      VcsImageSelector,
    },
    props: {
      modelValue: {
        type: Object as PropType<ImageStyleOptions>,
        default: undefined,
      },
    },
    setup(props, { emit }) {
      const canvas = ref<HTMLCanvasElement | null>(null);
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

      return { canvas };
    },
  });
</script>

<style scoped></style>
