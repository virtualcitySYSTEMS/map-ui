<template>
  <div class="d-inline-flex rounded oblique-orientation">
    <div class="d-inline-flex rounded inner">
      <OrientationToolsButton
        @click="input(-90)"
        icon="$vcsRotateLeft"
        tooltip="navigation.obliqueLeftTooltip"
        elevation="0"
        :disabled="disabled"
      />
      <OrientationToolsButton
        @click="input(90)"
        icon="$vcsRotateRight"
        tooltip="navigation.obliqueRightTooltip"
        elevation="0"
        :disabled="disabled"
      />
    </div>
  </div>
</template>

<script>
  import OrientationToolsButton from './OrientationToolsButton.vue';

  /**
   * @vue-prop {number} value - the current heading
   * @vue-prop {boolean} disabled - whether ObliqueRotation should be disabled
   * @vue-event {number} input
   */
  export default {
    name: 'ObliqueRotation',
    components: { OrientationToolsButton },
    props: {
      modelValue: {
        type: Number,
        required: true,
      },
      disabled: {
        type: Boolean,
        default: false,
        required: false,
      },
    },
    methods: {
      input(rotation) {
        let currentValue = this.modelValue + rotation;
        if (currentValue > 360) {
          currentValue -= 360;
        } else if (currentValue < 0) {
          currentValue += 360;
        }
        this.$emit('update:modelValue', currentValue);
      },
    },
  };
</script>

<style lang="scss" scoped>
  .oblique-orientation {
    box-shadow: rgba(0, 0, 0, 0.15) 0 2px 2px 0;
    .inner {
      box-shadow: rgba(0, 0, 0, 0.25) 0 -2px 2px 0 inset;
    }
    :deep(.btn-orientation-tools) {
      &:first-child {
        box-shadow:
          rgba(0, 0, 0, 0.25) 2px 2px 1px -2px,
          rgba(0, 0, 0, 0.02) -3px 2px 2px 0,
          rgba(0, 0, 0, 0.12) 0 1px 1px 0 !important;
      }
      &:last-child {
        box-shadow:
          rgba(0, 0, 0, 0.02) 1px 4px 1px -2px,
          rgba(0, 0, 0, 0.02) 1px 2px 1px 0,
          rgba(0, 0, 0, 0.1) 1px 1px 1px 0 !important;
      }
    }
  }
</style>
