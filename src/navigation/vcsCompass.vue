<template>
  <v-sheet
    ref="compassRef"
    :style="{
      transform: `rotate(${compassRotation}deg)`,
      cursor,
    }"
    @mousedown="trackMouse"
    class="
        h-16 w-16
        d-flex flex-column justify-center align-center
        position-relative
        rounded-circle
        user-select-none
        transition-transform-200-ease
      "
    elevation="1"
  >
    <span>N</span>
    <MapNavCompass
      class="position-absolute pos-a-0 primary--text"
      @direction-click="$emit('input', $event)"
      :can-emit="viewMode === '3d' || viewMode === 'oblique'"
      :hide-ticks="viewMode === 'oblique'"
    />
  </v-sheet>
</template>


<script>
  import { computed, onUnmounted, ref } from 'vue';

  import { fromEvent, merge, of, Subject } from 'rxjs';
  import { takeUntil, tap } from 'rxjs/operators';

  import { VSheet } from 'vuetify/lib';
  import MapNavCompass from './mapNavCompass.vue';

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
    setup(props, context) {
      const destroy$ = new Subject();
      const grabbing = ref();
      const compassRef = ref();

      const mouseAngle = ({ referenceEl, event }) => {
        const { left, width, top, height } = referenceEl.getBoundingClientRect();
        const boxCenter = [left + width / 2, top + height / 2];
        const angle = Math.atan2(event.pageX - boxCenter[0], -(event.pageY - boxCenter[1])) * (180 / Math.PI);

        if (angle < 0) {
          return 360 + angle;
        }

        return angle;
      };

      const trackMouse = (e) => {
        if (props.viewMode === '3d') {
          document.body.style.cursor = 'grabbing';
          const timeout = setTimeout(() => {
            grabbing.value = true;
          }, 200);

          const finish = () => {
            clearTimeout(timeout);
            document.body.style.cursor = 'unset';
            grabbing.value = false;
          };

          merge(
            of(e),
            fromEvent(document.body, 'mousemove'),
          ).pipe(
            tap((event) => {
              if (grabbing.value) {
                const rotation = mouseAngle({ event, referenceEl: compassRef.value.$el });
                context.emit('input', -1 * rotation);
              }
            }),
            takeUntil(fromEvent(document.body, 'mouseup').pipe(
              tap(() => finish()),
            )),
            takeUntil(fromEvent(document.body, 'mouseleave').pipe(
              tap(() => finish()),
            )),
            takeUntil(destroy$),
          ).subscribe();
        }
      };

      const cursor = computed(() => {
        if (props.viewMode === '3d') {
          return grabbing.value ? 'grabbing' : 'grab';
        }
        return 'auto';
      });

      const rotationValue = ref(props.value);

      onUnmounted(() => {
        destroy$.next();
        destroy$.unsubscribe();
      });

      return {
        trackMouse,
        compassRef,
        cursor,
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
