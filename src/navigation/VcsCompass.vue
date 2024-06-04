<template>
  <v-sheet
    :style="{
      transform: `rotate(${compassRotation}deg)`,
    }"
    @click="$emit('update:modelValue', 0)"
    class="h-16 w-16 d-flex flex-column justify-center align-center position-relative rounded-circle user-select-none transition-transform-200-ease"
    elevation="1"
  >
    <span>N</span>
    <MapNavCompass
      class="position-absolute top-0 bottom-0 right-0 left-0 text-primary"
      @click="$event.stopPropagation()"
      @direction-click="$emit('update:modelValue', $event)"
      :can-emit="!disabled && (viewMode === '3d' || viewMode === 'oblique')"
      :hide-ticks="viewMode === 'oblique'"
    />
  </v-sheet>
</template>
<style lang="scss" scoped>
  .h-16 {
    height: 64px;
  }
  .w-16 {
    width: 64px;
  }
</style>
<script>
  import { computed, ref } from 'vue';

  import { VSheet } from 'vuetify/components';
  import MapNavCompass from './MapNavCompass.vue';

  /**
   * @description Compass component to be shown on the map.
   * @vue-prop {OrientationToolsViewMode}  viewMode  - Mode of the map. Defines the behaviour of the compass.
   * @vue-prop {number}                     value     - Number of degrees of the compass rotation.
   * @vue-event {number} input
   * @vue-prop {boolean} disabled - whether compass should be disabled
   */
  export default {
    name: 'VcsCompass',
    components: {
      MapNavCompass,
      VSheet,
    },
    props: {
      viewMode: {
        type: String,
        required: true,
      },
      modelValue: {
        type: Number,
        default: 0,
      },
      disabled: {
        type: Boolean,
        default: false,
        required: false,
      },
    },
    setup(props) {
      const rotationValue = ref(props.modelValue);

      return {
        rotationValue,
        compassRotation: computed(() => -1 * rotationValue.value),
      };
    },
    watch: {
      modelValue(newValue, oldValue) {
        let diff = newValue - oldValue;
        if (diff > 180) {
          diff -= 360;
        } else if (diff < -180) {
          diff += 360;
        }
        this.rotationValue += diff;
      },
    },
  };
</script>
