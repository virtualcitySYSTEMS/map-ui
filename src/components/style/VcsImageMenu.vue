<template>
  <MenuWrapper
    v-bind="{ value, valueDefault }"
    :value-fallback="{
      radius: 10,
      fill: { color: [255, 255, 255, 1] },
      stroke: { color: [0, 0, 0, 1], width: 2 },
    }"
    v-on="$listeners"
    name="components.style.image"
  >
    <template #preview>
      <canvas ref="canvas" width="32" height="24" />
    </template>
    <template #content>
      <VcsImageSelector
        v-bind="{ value, valueDefault, iconOptions, extendedShapeSettings }"
        v-on="$listeners"
        class="pb-2"
      />
    </template>
  </MenuWrapper>
</template>

<script>
  import { onMounted, ref, watch } from 'vue';
  import { VcsImageSelector } from '@vcmap/ui';
  import MenuWrapper from './MenuWrapper.vue';
  import { drawImageStyle } from './VcsImageSelector.vue';

  /**
   * @description A wrapper for the VcsImageSelector, that has a small shape/icon preview and a menu that pops up when clicking the preview, containing the image selector.
   * @vue-prop {import("ol/style/RegularShape").Options | import("ol/style/Circle").Options | import("ol/style/Icon").Options} value - The Image options
   * @vue-prop {import("ol/style/RegularShape").Options | import("ol/style/Circle").Options | import("ol/style/Icon").Options} valueDefault - The default image options
   * @vue-prop {import("ol/style/Icon").Options} iconOptions - The icon options too choose from. Scale and opacity are ignored.
   * @vue-prop {boolean} [extendedShapeSettings=false] - If true, there are all the input fields needed to create arbitrary ol RegularShapes.
   */
  export default {
    name: 'VcsImageMenu',
    components: {
      MenuWrapper,
      VcsImageSelector,
    },
    props: {
      value: {
        type: Object,
        default: undefined,
      },
      valueDefault: {
        type: Object,
        default: undefined,
      },
      iconOptions: {
        type: Array,
        default: undefined,
      },
      extendedShapeSettings: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      const canvas = ref(null);

      onMounted(() => {
        drawImageStyle(canvas.value, props.value, true);
        watch(
          () => props.value,
          () => {
            // XXX Maybe add some sort of timeout funciton, so it draws only once when user stops using the slider
            drawImageStyle(canvas.value, props.value, true);
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
