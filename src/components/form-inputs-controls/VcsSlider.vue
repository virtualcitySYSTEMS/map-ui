<template>
  <v-slider
    class="vcs-slider"
    :dense="$attrs.dense !== false"
    hide-details
    v-bind="{ ...$attrs }"
    v-on="{ ...$listeners }"
    :color="$attrs.color || 'base darken-1'"
    :track-color="$attrs['track-color'] || 'base darken-1'"
    :thumb-color="$attrs['thumb-color'] || 'base darken-3'"
  />
</template>
<style lang="scss" scoped>
  @import '../../styles/shades.scss';
  .vcs-slider {
    ::v-deep {
      .v-slider {
        .v-slider__thumb {
          border: 2px solid;
          &:before {
            display: none;
          }
        }
        &.theme--light {
          .v-slider__thumb {
            border-color: map-get($shades, 'white') !important;
          }
        }
        &.theme--dark {
          .v-slider__thumb {
            border-color: map-get($shades, 'black') !important;
          }
        }
        .v-slider__tick,
        .v-slider__tick--filled {
          background-color: var(--v-base-darken1);
          height: 4px !important;
          top: calc(50% - 2px) !important;
        }
        &.v-slider--vertical {
          .v-slider__tick,
          .v-slider__tick--filled {
            width: 4px !important;
            height: 2px !important;
            right: calc(50% - 2px) !important;
            top: auto !important;
          }
        }
      }
    }
    &:not(.v-input--dense) {
      ::v-deep {
        .v-slider.v-slider--horizontal {
          margin-left: 12px;
          margin-right: 12px;
        }
      }
    }
  }
</style>
<script>
  import { VSlider } from 'vuetify/lib';
  /**
   * @description stylized wrapper around {@link https://v2.vuetifyjs.com/en/components/sliders/#api}.
   */
  export default {
    name: 'VcsSlider',
    components: {
      VSlider,
    },
  };
</script>
