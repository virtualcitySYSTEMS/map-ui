<template>
  <VcsTooltip
    :tooltip="$t('navigation.pitchTooltip', [Math.round(modelValue)])"
    tooltip-position="left"
  >
    <template #activator="{ props }">
      <v-card class="w-8" v-bind="props" :disabled="disabled">
        <v-slider
          track-color="base lighten-3"
          v-model="tilt"
          :max="0"
          :min="-90"
          direction="vertical"
          hide-details
          class="vcs-slider"
          v-bind="{ ...$attrs }"
        />
      </v-card>
    </template>
  </VcsTooltip>
</template>
<style lang="scss" scoped>
  @import '../styles/shades.scss';
  .vcs-slider {
    :deep(.v-slider) {
      min-height: 48px;
      margin-top: 8px;
      margin-bottom: 8px;
    }
    :deep(.v-slider__thumb) {
      cursor: pointer;
      border-radius: 3px;
      width: 16px;
      height: 4px;
      border: 0;
      left: -8px;
      &:before {
        background-color: transparent;
      }
    }
  }
  .v-application .theme--light.vcs-slider {
    :deep(.v-slider) {
      .v-slider__track-container {
        .v-slider__track-fill {
          background-color: map-get($shades, 'black') !important;
        }
      }
      .v-slider__thumb {
        background-color: map-get($shades, 'black') !important;
      }
    }
  }
  .v-application .theme--dark.vcs-slider {
    :deep(.v-slider) {
      .v-slider__track-container {
        .v-slider__track-fill {
          background-color: map-get($shades, 'white') !important;
        }
      }
      .v-slider__thumb {
        background-color: map-get($shades, 'white') !important;
      }
    }
  }
  .w-8 {
    width: 32px;
  }
</style>
<script>
  import { clamp } from 'ol/math.js';
  import { VCard, VSlider } from 'vuetify/components';
  import VcsTooltip from '../components/notification/VcsTooltip.vue';

  /**
   * @description A vertical slider from 0 to -90. pass value with v-model
   * @vue-prop {number} value
   * @vue-prop {boolean} disabled - whether tilt slider should be disabled
   * @vue-event {number} input
   */
  export default {
    name: 'TiltSlider',
    components: {
      VcsTooltip,
      VCard,
      VSlider,
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
    data() {
      return {
        localValue: Math.round(this.modelValue),
      };
    },
    watch: {
      modelValue() {
        this.localValue = clamp(Math.round(this.modelValue), -90, 0);
      },
    },
    computed: {
      tilt: {
        get() {
          return this.localValue;
        },
        set(value) {
          if (value !== this.localValue) {
            this.localValue = value;
            this.$emit('update:modelValue', value);
          }
        },
      },
    },
  };
</script>
