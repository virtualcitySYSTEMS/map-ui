<template>
  <span>
    <v-tooltip location="start" target="parent" :disabled="!canEmit">
      <template #activator="{ props }">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="58"
          height="58"
          viewBox="0 0 58 58"
        >
          <g
            id="Group_1654"
            data-name="Group 1654"
            transform="translate(24)"
            v-bind="props"
          >
            <path
              :class="canEmit ? 'cursor-pointer hover' : ''"
              id="north_arrow"
              data-name="Polygon 14"
              d="M4,0,8,13H0Z"
              transform="translate(1)"
              fill="currentColor"
              @click="emit($event, 0)"
              @mouseenter="alignment = 'alignNorth'"
            />
            <path
              :class="canEmit ? 'cursor-pointer hover' : ''"
              id="south_arrow"
              data-name="Polygon 17"
              d="M4,0,8,13H0Z"
              transform="translate(9 58) rotate(180)"
              fill="rgba(88,88,88,0.51)"
              @click="emit($event, 180)"
              @mouseenter="alignment = 'alignSouth'"
            />
          </g>
          <g
            id="Group_1653"
            data-name="Group 1653"
            transform="translate(0 33) rotate(-90)"
            v-bind="props"
          >
            <path
              :class="canEmit ? 'cursor-pointer hover' : ''"
              id="west_arrow"
              data-name="Polygon 14"
              d="M4,0,8,13H0Z"
              fill="rgba(88,88,88,0.51)"
              @click="emit($event, 270)"
              @mouseenter="alignment = 'alignWest'"
            />
            <path
              :class="canEmit ? 'cursor-pointer hover' : ''"
              id="east_arrow"
              data-name="Polygon 17"
              d="M4,0,8,13H0Z"
              transform="translate(8 58) rotate(180)"
              fill="rgba(88,88,88,0.51)"
              @click="emit($event, 90)"
              @mouseenter="alignment = 'alignEast'"
            />
          </g>
          <g
            id="Group_1672"
            data-name="Group 1672"
            transform="translate(1)"
            v-if="!hideTicks"
          >
            <line
              id="Line_289-2"
              data-name="Line 289"
              x2="6.079"
              transform="translate(3.751 15) rotate(30)"
              fill="none"
              stroke="#707070"
              stroke-linecap="round"
              stroke-width="1"
            />
            <line
              id="Line_290-2"
              data-name="Line 290"
              x2="4.665"
              transform="translate(48.208 40.667) rotate(30)"
              fill="none"
              stroke="#707070"
              stroke-linecap="round"
              stroke-width="1"
            />
            <line
              id="Line_289-4"
              data-name="Line 289"
              x2="6.079"
              transform="translate(14 53.249) rotate(-60)"
              fill="none"
              stroke="#707070"
              stroke-linecap="round"
              stroke-width="1"
            />
            <line
              id="Line_290-3"
              data-name="Line 290"
              x2="4.665"
              transform="translate(39.668 8.792) rotate(-60)"
              fill="none"
              stroke="#707070"
              stroke-linecap="round"
              stroke-width="1"
            />
            <line
              id="Line_289-5"
              data-name="Line 289"
              x2="6.079"
              transform="translate(14 4.751) rotate(60)"
              fill="none"
              stroke="#707070"
              stroke-linecap="round"
              stroke-width="1"
            />
            <line
              id="Line_290-4"
              data-name="Line 290"
              x2="4.665"
              transform="translate(39.667 49.208) rotate(60)"
              fill="none"
              stroke="#707070"
              stroke-linecap="round"
              stroke-width="1"
            />
            <line
              id="Line_289-6"
              data-name="Line 289"
              x2="6.079"
              transform="translate(3.752 43) rotate(-30)"
              fill="none"
              stroke="#707070"
              stroke-linecap="round"
              stroke-width="1"
            />
            <line
              id="Line_290-5"
              data-name="Line 290"
              x2="4.665"
              transform="translate(48.209 17.333) rotate(-30)"
              fill="none"
              stroke="#707070"
              stroke-linecap="round"
              stroke-width="1"
            />
          </g>
        </svg>
      </template>
      <span>{{ $st(`navigation.compass.${alignment}`) }}</span>
    </v-tooltip>
  </span>
</template>

<script>
  import { ref } from 'vue';
  import { VTooltip } from 'vuetify/components';

  /**
   * @description The compass with ticks along the border and alignment tooltips on arrows.
   * @vue-prop {boolean} [canEmit=true] - whether to emit click events on cardinal direction arrows or not
   * @vue-prop {boolean} [hideTicks=false] - hide ticks on navigation rose
   * @vue-event {HTMLEvent} direction-click - raised when a cardinal direction arrow is clicked
   */
  export default {
    components: { VTooltip },
    props: {
      canEmit: {
        type: Boolean,
        default: true,
      },
      hideTicks: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['direction-click'],
    setup() {
      return { alignment: ref('') };
    },
    methods: {
      emit(event, dir) {
        if (this.canEmit) {
          event.preventDefault();
          event.stopPropagation();
          this.$emit('direction-click', dir);
        }
      },
    },
  };
</script>

<style lang="scss" scoped>
  svg {
    width: 85%;
    height: 85%;
    margin: 7.5%;
  }
  svg g:focus {
    outline: none;
  }
  .hover:hover {
    fill: var(--v-primary-lighten1) !important;
  }
</style>
