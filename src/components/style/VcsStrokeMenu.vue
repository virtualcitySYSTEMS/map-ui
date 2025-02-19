<template>
  <StyleMenuWrapper
    class="vcs-stroke-menu"
    :value-fallback="{ color: [0, 0, 0, 1], width: 1 }"
    name="components.style.stroke"
    v-bind="{ ...$attrs, ...$props }"
  >
    <template #preview>
      <v-sheet
        class="stroke-box"
        :style="{
          borderColor: rgbaString,
        }"
        width="100%"
        height="100%"
      />
    </template>
    <template #content>
      <VcsStrokeSelector v-bind="{ ...$attrs, ...$props }" />
    </template>
  </StyleMenuWrapper>
</template>

<script>
  import { computed } from 'vue';
  import { VSheet } from 'vuetify/components';
  import { useProxiedAtomicModel } from '../modelHelper.js';
  import VcsStrokeSelector from './VcsStrokeSelector.vue';
  import StyleMenuWrapper from './StyleMenuWrapper.vue';
  import { useColorObject, rgbaObjectToString } from './composables.js';

  /**
   * @description A wrapper for the VcsStrokeSelector, that has a small color preview and a menu that pops up when clicking the preview, containing the stroke selector.
   * When clicking the reset button, the valueDefault is emitted, when unchecking the checkbox in front of the preview, null is emitted.
   * If it is checked again, valueDefault is emitted. If the valueDefault is undefined or null, { color: [0, 0, 0, 1], width: 1 } is emitted.
   * @vue-prop {import("ol/style/Stroke").Options} [modelValue] - The Stroke Options
   */
  export default {
    name: 'VcsStrokeMenu',
    components: {
      VSheet,
      VcsStrokeSelector,
      StyleMenuWrapper,
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

<style scoped>
  .stroke-box {
    border: 3px solid;
    background-color: transparent;
  }
</style>
