<template>
  <div class="media-slider pa-1" :class="[...customClasses]">
    <v-slider
      :max="max"
      :min="min"
      v-model="value"
      class="media-slider py-2"
      hide-details
      color="gray"
      track-color="gray"
    />

    <v-container fluid class="pt-0 pb-2 px-2">
      <v-row no-gutters>
        <v-col cols="2" class="text-left line-height-30px">
          {{ value }}
        </v-col>
        <v-spacer />
        <v-col cols="8">
          <div class="d-flex align-center justify-space-between flex-grow-1 mx-2">
            <v-icon @click="() => {}" v-text="'$vcsSkipPrevious'" size="12" />
            <v-icon @click="() => {}" v-text="'$vcsRewind'" size="12" />
            <v-icon @click="() => {}" v-text="'$vcsPlayCircle'" size="30" />
            <v-icon @click="() => {}" v-text="'$vcsFastForward'" size="12" />
            <v-icon @click="() => {}" v-text="'$vcsSkipNext'" size="12" />
          </div>
        </v-col>
        <v-spacer />
        <v-col cols="2" class="text-right line-height-30px">
          {{ max }}
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style lang="scss" scoped>

  ::v-deep {
    .v-slider__thumb {
      &::before {
        content: attr(value);
        font-size: 9px;
        color: black;
        width: unset;
        height: unset;
        border-radius: unset;
        background: unset;
        opacity: unset;
        transform: unset;
      }
    }
  }

  .media-slider {
    ::v-deep {
      .v-slider__thumb {
        width: 20px;
        height: 20px;
        left: -10px;
        background-color: white !important;
        border: 2px solid;

        &::before {
          left: 50%;
          transform: translateX(-50%) !important;
          opacity: 0;
        }
      }

      .v-slider__thumb-container--active {
        .v-slider__thumb {
          &::before {
            left: 50%;
            transform: translateX(-50%) !important;
            top: -16px;
            opacity: 1 !important;
          }
        }
      }
    }
  }

</style>

<script>
  import Vue from 'vue';
  /**
   * @description Music-player-like component which controls a timeline.
   *
   * @vue-prop {number}  value - Current position on timeline.
   * @vue-prop {number}  max - Max value of timeline.
   * @vue-prop {number}  min - Min value of timeline.
   */
  export default Vue.extend({
    name: 'VcsMediaControls',
    props: {
      min: {
        type: Number,
        default: 0,
      },
      max: {
        type: Number,
        default: 79,
      },
      value: {
        type: Number,
        default: 30,
      },
      customClasses: {
        type: Array,
        default: () => ([]),
      },
    },
    watch: {
      value(v) {
        document
          .querySelector('.media-slider .v-slider__thumb')
          .setAttribute('value', v);
      },
    },
  });
</script>
