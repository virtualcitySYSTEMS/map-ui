<template>
  <div class="d-inline-flex rounded vcs-oblique-orientation">
    <div class="d-inline-flex rounded inner">
      <OrientationToolsButton
        @click="input(-90)"
        icon="$vcsRotateLeft"
        tooltip="navigation.obliqueLeftTooltip"
        elevation="0"
      />
      <OrientationToolsButton
        @click="input(90)"
        icon="$vcsRotateRight"
        tooltip="navigation.obliqueRightTooltip"
        elevation="0"
      />
    </div>
  </div>
</template>

<script>
  import OrientationToolsButton from './orientationToolsButton.vue';

  /**
   * @vue-prop {number} value - the current heading
   * @vue-event {number} input
   */
  export default {
    name: 'ObliqueRotation',
    components: { OrientationToolsButton },
    props: {
      value: {
        type: Number,
        required: true,
      },
    },
    methods: {
      input(rotation) {
        let currentValue = this.value + rotation;
        if (currentValue > 360) {
          currentValue -= 360;
        } else if (currentValue < 0) {
          currentValue += 360;
        }
        this.$emit('input', currentValue);
      },
    },
  };
</script>

<style lang="scss" scoped>
  .vcs-oblique-orientation {
    box-shadow: rgba(0, 0, 0, 0.15) 0 2px 2px 0;
    .inner {
      box-shadow: rgba(0, 0, 0, 0.25) 0 -2px 2px 0 inset;
    }
    ::v-deep {
      .btn-orientation-tools {
        &:first-child {
          box-shadow: rgba(0, 0, 0, 0.25) 2px 2px 1px -2px,
            rgba(0, 0, 0, 0.02) -3px 2px 2px 0, rgba(0, 0, 0, 0.12) 0 1px 1px 0 !important;
        }
        &:last-child {
          box-shadow: rgba(0, 0, 0, 0.02) 1px 4px 1px -2px,
            rgba(0, 0, 0, 0.02) 1px 2px 1px 0, rgba(0, 0, 0, 0.1) 1px 1px 1px 0 !important;
        }
      }
    }
  }
</style>
