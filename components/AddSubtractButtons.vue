<template>
  <div>
    <v-card
      @click="emit(value + 1)"
      ref="zoomInRef"
      elevation="2"
      class="h-8 w-8 mt-3 d-flex align-center justify-center text-center"
    >
      <v-icon v-text="'$vcsPlus'" size="16" />
    </v-card>
    <v-card
      @click="emit(value - 1)"
      ref="zoomOutRef"
      elevation="2"
      class="h-8 w-8 d-flex align-center justify-center text-center"
    >
      <v-icon v-text="'$vcsMinus'" size="16" />
    </v-card>
  </div>
</template>

<script>
  import VueCompositionAPI, { defineComponent, onMounted, onUnmounted, ref } from '@vue/composition-api';
  import { fromEvent, interval, Subject } from 'rxjs';
  import { switchMap, takeUntil } from 'rxjs/operators';
  import Vue from 'vue';

  Vue.use(VueCompositionAPI);

  export default defineComponent({
    props: {
      value: {
        type: Number,
        default: 0,
      },
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 100,
      },
    },
    setup(props, context) {
      const destroy$ = new Subject();
      const zoomOutRef = ref();
      const zoomInRef = ref();

      const emit = (value) => {
        if (value >= props.min && value <= props.max) {
          context.emit('input', value);
        }
      };

      onMounted(() => {
        fromEvent(zoomOutRef.value.$el, 'mousedown').pipe(
          takeUntil(destroy$),
          switchMap(() => interval(100).pipe(
            takeUntil(fromEvent(document.body, 'mouseup')),
          )),
        ).subscribe(() => {
          context.emit('input', props.value - 1);
        });

        fromEvent(zoomInRef.value.$el, 'mousedown').pipe(
          takeUntil(destroy$),
          switchMap(() => interval(100).pipe(
            takeUntil(fromEvent(document.body, 'mouseup')),
          )),
        ).subscribe(() => {
          context.emit('input', props.value + 1);
        });
      });
      onUnmounted(() => {
        destroy$.next();
        destroy$.unsubscribe();
      });

      return {
        emit,
        zoomOutRef,
        zoomInRef,
      };
    },
  });
</script>
