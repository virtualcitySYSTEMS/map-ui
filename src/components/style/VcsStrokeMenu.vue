<template>
  <MenuWrapper
    v-bind="{ value, valueDefault, disabled }"
    :value-fallback="{ color: [0, 0, 0, 1], width: 1 }"
    v-on="$listeners"
    name="components.style.stroke"
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
      <VcsStrokeSelector :value="value" v-on="$listeners" />
    </template>
  </MenuWrapper>
</template>

<script>
  import { computed } from 'vue';
  import { VSheet } from 'vuetify/lib';
  import { VcsStrokeSelector } from '@vcmap/ui';
  import MenuWrapper from './MenuWrapper.vue';
  import { useColorObject, rgbaObjectToString } from './composables.js';

  /**
   * @description A wrapper for the VcsStrokeSelector, that has a small color preview and a menu that pops up when clicking the preview, containing the stroke selector.
   * When clicking the reset button, the valueDefault is emitted, when unchecking the checkbox in front of the preview, null is emitted. If it is checked again, valueDefault is emitted. If the valueDefault is undefined or null, { color: [0, 0, 0, 1], width: 1 } is emitted.
   * @vue-prop {import("ol/style/Stroke").Options} [value] - The Stroke Options
   * @vue-prop {import("ol/style/Stroke").Options} [valueDefault] - The default Stroke Options.
   * @vue-prop {boolean} [disabled=false] - Disable the input
   */
  export default {
    name: 'VcsStrokeMenu',
    components: {
      VSheet,
      VcsStrokeSelector,
      MenuWrapper,
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
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      const rgbaObject = useColorObject(() => props.value?.color);
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
