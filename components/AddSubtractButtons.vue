<template>
  <div>
    <v-card
      @click="emit(value + 1)"
      ref="zoom-in"
      elevation="2"
      class="h-8 w-8 mt-3 d-flex align-center justify-center text-center"
    >
      <v-icon v-text="'$vcsPlus'" size="16" />
    </v-card>
    <v-card
      @click="emit(value - 1)"
      ref="zoom-out"
      elevation="2"
      class="h-8 w-8 d-flex align-center justify-center text-center"
    >
      <v-icon v-text="'$vcsMinus'" size="16" />
    </v-card>
  </div>
</template>

<script>
  import { fromEvent, interval, Subject } from 'rxjs';
  import { switchMap, takeUntil } from 'rxjs/operators';
  import Vue from 'vue';

  export default Vue.extend({
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
    setup() {
      return {
        destroy$: new Subject(),
      };
    },
    mounted() {
      this.zoomInSubscripton();
      this.zoomOutSubscripton();
    },
    methods: {
      emit(value) {
        if (value >= this.min && value <= this.max) {
          this.$emit('input', value);
        }
      },
      zoomOutSubscripton() {
        const zoomOutRef = this.$refs['zoom-out'].$el;
        fromEvent(zoomOutRef, 'mousedown').pipe(
          takeUntil(this.destroy$),
          switchMap(() => interval(100).pipe(
            takeUntil(fromEvent(document.body, 'mouseup')),
          )),
        ).subscribe(() => {
          this.emit(this.value - 1);
        });
      },
      zoomInSubscripton() {
        const zoomInRef = this.$refs['zoom-in'].$el;
        fromEvent(zoomInRef, 'mousedown').pipe(
          takeUntil(this.destroy$),
          switchMap(() => interval(100).pipe(
            takeUntil(fromEvent(document.body, 'mouseup')),
          )),
        ).subscribe(() => {
          this.emit(this.value + 1);
        });
      },
    },
  });
</script>
