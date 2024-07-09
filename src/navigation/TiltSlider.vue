<template>
  <v-card
    :width="minWidth"
    :height="minHeight"
    v-bind="props"
    :disabled="disabled"
  >
    <v-slider
      :track-size="trackSize"
      :tick-size="tickSize"
      :track-color="'base-lighten-3'"
      thumb-color="base-darken-4"
      track-fill-color="'base-darken-4'"
      :max="0"
      :min="-90"
      direction="vertical"
      hide-details
      class="vcs-tilt-slider"
      v-bind="{ ...$attrs }"
      v-model="localValue"
    ></v-slider>
    <v-tooltip
      activator="parent"
      location="left"
      :text="$st('navigation.pitchTooltip', [Math.round(localValue)])"
    ></v-tooltip>
  </v-card>
</template>

<style lang="scss" scoped>
  .v-slider.v-input--vertical {
    :deep(.v-slider-track__fill) {
      width: 2px;
    }
    :deep(.v-slider-track__tick--first) {
      bottom: 0;
    }
    :deep(.v-slider-track__tick--last) {
      bottom: 100%;
    }
  }

  .vcs-tilt-slider {
    margin-top: 6px;
    margin-bottom: 10px;
    :deep(.v-slider-thumb__surface) {
      border-radius: 3px;
      width: 16px;
      height: 4px;
      margin-top: 10px;
      box-shadow: none !important;
    }
  }
  :deep(.v-slider-thumb__surface::before) {
    --v-focus-opacity: 0;
    --v-hover-opacity: 0;
    --v-pressed-opacity: 0;
  }

  .v-input--vertical :deep(.v-input__control) {
    min-height: calc(var(--v-vcs-font-size) * 4);
  }
</style>

<script>
  import { computed, defineComponent } from 'vue';
  import { VCard, VSlider, VTooltip } from 'vuetify/components';
  import { useFontSize, useItemHeight } from '../vuePlugins/vuetify.js';
  import { useProxiedAtomicModel } from '../components/modelHelper.js';

  export default defineComponent({
    name: 'TiltSlider',
    components: {
      VCard,
      VSlider,
      VTooltip,
    },
    props: {
      modelValue: {
        type: Number,
        required: true,
      },
      disabled: {
        type: Boolean,
        required: false,
        default: false,
      },
    },
    setup(props, { emit }) {
      const itemHeight = useItemHeight();

      const trackSize = computed(() => {
        return Math.floor(itemHeight.value / 12);
      });
      const tickSize = computed(() => {
        return trackSize.value * 2;
      });
      const fontSize = useFontSize();
      const minWidth = computed(() => {
        return fontSize.value * 2.5;
      });
      const minHeight = computed(() => {
        return fontSize.value * 5;
      });

      const localValue = useProxiedAtomicModel(props, 'modelValue', emit);

      return {
        localValue,
        tickSize,
        trackSize,
        props,
        minWidth,
        minHeight,
      };
    },
  });
</script>
