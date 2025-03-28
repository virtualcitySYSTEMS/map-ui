<template>
  <v-slider
    :class="{
      'py-1': !paddingProvided,
      'remove-append-margin': !hasAppendSlot,
    }"
    class="vcs-slider mx-1"
    hide-details
    ref="sliderRef"
    :track-color="'base-darken-1'"
    thumb-color="base-darken-3"
    track-fill-color="base-darken-1"
    :thumb-size="thumbSize"
    :track-size="trackSize"
    :tick-size="tickSize"
    v-bind="{ ...$attrs }"
  >
    <template v-for="slot of forwardSlots" #[slot]="scope">
      <slot :name="slot" v-bind="scope ?? {}" />
    </template>

    <template #append="scope">
      <slot name="append" v-bind="scope ?? {}"></slot>
      <v-tooltip
        v-if="tooltip"
        :activator="sliderRef"
        :location="tooltipPosition"
        :text="$st(tooltip)"
      ></v-tooltip>
    </template>
  </v-slider>
</template>
<script>
  import { computed, ref } from 'vue';
  import { VSlider, VTooltip } from 'vuetify/components';
  import { getForwardSlots, usePadding } from '../composables.js';
  import { useFontSize } from '../../vuePlugins/vuetify.js';

  /**
   * @description stylized wrapper around {@link https://vuetifyjs.com/en/components/sliders/#usage}.
   * @vue-prop {('bottom' | 'left' | 'top' | 'right')}  [tooltipPosition='right'] - Position of the tooltip.
   * @vue-prop {string|undefined}                       tooltip - Optional tooltip which will be shown on hover when no error message is shown
   */
  export default {
    name: 'VcsSlider',
    components: {
      VSlider,
      VTooltip,
    },
    props: {
      tooltip: {
        type: String,
        default: undefined,
      },
      tooltipPosition: {
        type: String,
        default: 'right',
      },
    },
    setup(props, { attrs, slots }) {
      const fontSize = useFontSize();
      const thumbSize = computed(() => {
        return Math.floor((fontSize.value + 3) / 2);
      });
      const trackSize = computed(() => {
        return Math.floor((fontSize.value + 3) / 6);
      });
      const tickSize = computed(() => {
        return trackSize.value * 2;
      });
      const paddingProvided = usePadding(attrs);
      const forwardSlots = getForwardSlots(slots, ['append']);
      const sliderRef = ref();
      return {
        hasAppendSlot: computed(() => {
          return !!slots.append;
        }),
        forwardSlots,
        sliderRef,
        thumbSize,
        tickSize,
        trackSize,
        paddingProvided,
      };
    },
  };
</script>
<style lang="scss" scoped>
  .v-input--horizontal :deep(.v-input__control) {
    min-height: calc(var(--v-vcs-font-size) * 2 - 2px);
  }
  .v-input--horizontal.v-slider--has-labels {
    margin-bottom: var(--v-vcs-font-size);
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
  .remove-append-margin {
    :deep(.v-input__append) {
      margin-inline-start: 0px;
    }
  }
</style>
