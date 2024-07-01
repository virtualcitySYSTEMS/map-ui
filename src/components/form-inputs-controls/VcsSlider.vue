<template>
  <v-slider
    :class="{
      'py-1': !paddingProvided,
    }"
    class="VcsSlider"
    hide-details
    :track-color="'base-darken-1'"
    thumb-color="base-darken-3"
    track-fill-color="base-darken-1"
    :thumb-size="thumbSize"
    :track-size="trackSize"
    :tick-size="tickSize"
    v-bind="{ ...$attrs }"
  >
    <template v-for="slot of Object.keys($slots)" #[slot]="scope">
      <slot :name="slot" v-bind="scope" />
    </template>
  </v-slider>
</template>
<style lang="scss" scoped>
  .v-input--horizontal :deep(.v-input__control) {
    min-height: calc(var(--v-vcs-item-height) - 8px);
  }
  .v-slider.v-input--horizontal {
    :deep(.v-slider-track__fill) {
      height: 2px;
    }
    :deep(.v-slider-track__tick--first) {
      margin-inline-start: 0;
    }
    :deep(.v-slider-track__tick--last) {
      margin-inline-start: 100%;
    }
  }
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
  :deep(.v-slider-thumb__surface::before) {
    --v-focus-opacity: 0;
    --v-hover-opacity: 0;
    --v-pressed-opacity: 0;
  }
  :deep(.v-slider-track__tick) {
    background-color: rgb(var(--v-theme-base-darken-1));
  }
</style>
<script>
  import { computed } from 'vue';
  import { VSlider } from 'vuetify/components';
  import { usePadding } from '../composables.js';
  import { useItemHeight } from '../../vuePlugins/vuetify.js';

  /**
   * @description stylized wrapper around {@link https://v2.vuetifyjs.com/en/components/sliders/#api}.
   */
  export default {
    name: 'VcsSlider',
    components: {
      VSlider,
    },
    setup(props, { attrs }) {
      const itemHeight = useItemHeight();
      const thumbSize = computed(() => {
        return Math.floor(itemHeight.value / 4);
      });

      const trackSize = computed(() => {
        return Math.floor(itemHeight.value / 12);
      });
      const tickSize = computed(() => {
        return trackSize.value * 2;
      });
      const paddingProvided = usePadding(attrs);

      return {
        thumbSize,
        tickSize,
        trackSize,
        paddingProvided,
      };
    },
  };
</script>
