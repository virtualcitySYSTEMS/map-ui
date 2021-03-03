<template>
  <v-sheet
    ref="compassRef"
    :style="{
      transform: `rotate(${value}deg)`,
      cursor: grabbing ? 'grabbing' : 'grab'
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
    :elevation="elevation"
  >
    <span>N</span>
    <MapNavCompassRegular
      v-if="viewMode === '3d' || viewMode === '2d'"
      class="position-absolute pos-a-0 primary--text"
    />
    <MapNavCompassOblique
      v-if="viewMode === 'oblique'"
      class="position-absolute pos-a-0 primary--text"
    />
  </v-sheet>
</template>


<script>
  import { defineComponent, onUnmounted, ref } from '@vue/composition-api';

  import { fromEvent, merge, of, Subject } from 'rxjs';
  import { takeUntil, tap } from 'rxjs/operators';

  import MapNavCompassOblique from './icons/MapNavCompassOblique.vue';
  import MapNavCompassRegular from './icons/MapNavCompassRegular.vue';


  /**
   * @description Compass component to be shown on the map.
   * @vue-prop {('2d' | '3d' | 'oblique')}  viewMode  - Mode of the map. Defines the behaviour of the compass.
   * @vue-prop {number}                     value     - Number of degrees of the compass rotation.
   */
  export default defineComponent({
    name: 'VcsCompass',
    components: {
      MapNavCompassRegular,
      MapNavCompassOblique,
    },
    props: {
      viewMode: {
        type: String,
        default: undefined,
      },
      value: {
        type: Number,
        default: 0,
      },
      elevation: {
        type: Number,
        default: 1,
      },
    },
    setup(props, context) {
      const destroy$ = new Subject();
      const grabbing = ref();
      const compassRef = ref();

      const mouseAngle = ({ referenceEl, event }) => {
        const { left, width, top, height } = referenceEl.getBoundingClientRect();
        const boxCenter = [left + width / 2, top + height / 2];
        const angle = Math.atan2(
          event.pageX - boxCenter[0], -(event.pageY - boxCenter[1]),
        ) * (180 / Math.PI);

        if (angle < 0) {
          return 360 + angle;
        }

        return angle;
      };

      const trackMouse = (e) => {
        if (props.viewMode !== 'oblique') {
          document.body.style.cursor = 'grabbing';
          grabbing.value = true;
          merge(
            of(e),
            fromEvent(document.body, 'mousemove'),
          ).pipe(
            tap((event) => {
              const rotation = mouseAngle({ event, referenceEl: compassRef.value.$el });
              context.emit('input', rotation);
            }),
            takeUntil(fromEvent(document.body, 'mouseup').pipe(
              tap(() => {
                document.body.style.cursor = 'unset';
                grabbing.value = false;
              }),
            )),
            takeUntil(destroy$),
          ).subscribe();
        }

        if (props.viewMode === 'oblique') {
          const rotation = mouseAngle({ event: e, ref: compassRef.value.$el });
          const isEast = rotation >= 45 && rotation < 135;
          const isSouth = rotation >= 135 && rotation < 225;
          const isWest = rotation >= 225 && rotation < 315;

          if (isEast) {
            context.emit('input', 90);
            return;
          }
          if (isSouth) {
            context.emit('input', 180);
            return;
          }
          if (isWest) {
            context.emit('input', 270);
            return;
          }

          context.emit('input', 0);
        }
      };

      onUnmounted(() => {
        destroy$.next();
        destroy$.unsubscribe();
      });

      return {
        trackMouse,
        grabbing,
        compassRef,
      };
    },
  });
</script>
