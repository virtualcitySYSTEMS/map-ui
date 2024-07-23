<template>
  <MenuWrapper
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
      <VcsImageSelector
        v-bind="{
          ...$attrs,
          ...$props,
        }"
        class="pb-2"
      />
    </template>
  </MenuWrapper>
</template>

<script>
  import { onMounted, ref, watch } from 'vue';
  import { useProxiedAtomicModel } from '../modelHelper.js';
  import MenuWrapper from './MenuWrapper.vue';
  import VcsImageSelector, { drawImageStyle } from './VcsImageSelector.vue';

  /**
   * @description A wrapper for the VcsImageSelector, that has a small shape/icon preview and a menu that pops up when clicking the preview, containing the image selector.
   * @vue-prop {import("ol/style/RegularShape").Options | import("ol/style/Circle").Options | import("ol/style/Icon").Options} [modelValue] - The Image options
   */
  export default {
    name: 'VcsImageMenu',
    components: {
      MenuWrapper,
      VcsImageSelector,
    },
    props: {
      modelValue: {
        type: Object,
        default: undefined,
      },
    },
    setup(props, { emits }) {
      const canvas = ref(null);
      const localValue = useProxiedAtomicModel(props, 'modelValue', emits);

      onMounted(() => {
        drawImageStyle(canvas.value, localValue.value, true);
        watch(
          () => props.modelValue,
          () => {
            drawImageStyle(canvas.value, localValue.value, true);
          },
          { deep: true },
        );
      });

      return {
        canvas,
      };
    },
  };
</script>

<style scoped></style>
