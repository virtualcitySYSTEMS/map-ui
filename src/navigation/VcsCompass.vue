<template>
  <v-sheet
    :style="{
      transform: `rotate(${compassRotation}deg)`,
    }"
    @click="$emit('input', 0)"
    class="h-16 w-16 d-flex flex-column justify-center align-center position-relative rounded-circle user-select-none transition-transform-200-ease"
    elevation="1"
  >
    <span>N</span>
    <MapNavCompass
      class="position-absolute pos-a-0 primary--text"
      @click="$event.stopPropagation()"
      @direction-click="$emit('input', $event)"
      :can-emit="viewMode === '3d' || viewMode === 'oblique'"
      :hide-ticks="viewMode === 'oblique'"
    />
  </v-sheet>
</template>

<script>
  import { computed, ref } from 'vue';

  import { VSheet } from 'vuetify/lib';
  import MapNavCompass from './MapNavCompass.vue';

  /**
   * @description Compass component to be shown on the map.
   * @vue-prop {OrientationToolsViewMode}  viewMode  - Mode of the map. Defines the behaviour of the compass.
   * @vue-prop {number}                     value     - Number of degrees of the compass rotation.
   * @vue-event {number} input
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
      value: {
        type: Number,
        default: 0,
      },
    },
    setup(props) {
      const rotationValue = ref(props.value);

      return {
        rotationValue,
        compassRotation: computed(() => -1 * rotationValue.value),
      };
    },
    watch: {
      value(newValue, oldValue) {
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
