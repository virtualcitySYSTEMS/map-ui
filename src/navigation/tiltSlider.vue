<template>
  <VcsTooltip
    :tooltip="`Camera pitch: ${Math.round(value)}°`"
    tooltip-position="left"
  >
    <template #activator="{ on, attrs }">
      <v-card
        class="w-8"
        v-on="on"
        v-bind="attrs"
      >
        <v-slider
          color="secondary"
          track-color="accent"
          v-model="tilt"
          :max="0"
          :min="-90"
          vertical
          hide-details
          class="vcs-slider"
        />
      </v-card>
    </template>
  </VcsTooltip>
</template>
<style lang="scss" scoped>
  .vcs-slider{
    ::v-deep {
      .v-slider {
        min-height: 48px;
        margin-top: 8px;
        margin-bottom: 8px;
      }
      .v-slider__thumb{
        cursor: pointer;
        border-radius: 3px;
        width: 16px;
        height: 4px;
        border: 0;
        left: -8px;
        &:before{
          background-color: transparent;
        }
      }
    }
  }
</style>
<script>
  import { clamp } from 'ol/math.js';
  import VcsTooltip from '../components/notification/VcsTooltip.vue';

  /**
   * A vertical slider from 0 to -90. pass value with v-model
   * @vue-prop {number} value
   * @vue-event {number} input
   */
  export default {
    name: 'TiltSlider',
    components: {
      VcsTooltip,
    },
    props: {
      value: {
        type: Number,
        required: true,
      },
    },
    data() {
      return {
        localValue: Math.round(this.value),
      };
    },
    watch: {
      value() {
        this.localValue = clamp(Math.round(this.value), -90, 0);
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
            this.$emit('input', value);
          }
        },
      },
    },
  };
</script>

<style scoped>

</style>
