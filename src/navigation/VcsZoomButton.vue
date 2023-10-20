<template>
  <div class="rounded vcs-navigation-zoom">
    <div class="rounded inner">
      <OrientationToolsButton
        @click="$emit('zoom-in')"
        icon="$vcsPlus"
        tooltip="navigation.zoomInTooltip"
        elevation="0"
      />
      <OrientationToolsButton
        @click="$emit('zoom-out')"
        icon="$vcsMinus"
        tooltip="navigation.zoomOutTooltip"
        elevation="0"
      />
    </div>
  </div>
</template>

<script>
  import OrientationToolsButton from './OrientationToolsButton.vue';

  /**
   * @description Zoom buttons rendered above each other.
   * @vue-event {void} zoom-in - raised when zoom in is called
   * @vue-event {void} zoom-out - raised when zoom out is called
   */
  export default {
    components: { OrientationToolsButton },
  };
</script>
<style lang="scss" scoped>
  .vcs-navigation-zoom {
    box-shadow: rgba(0, 0, 0, 0.1) 0 2px 2px 0;
    .inner {
      box-shadow: rgba(0, 0, 0, 0.25) 0 0 10px 0 inset;
    }
    ::v-deep {
      .btn-orientation-tools {
        &:first-child {
          box-shadow:
            rgba(0, 0, 0, 0.25) -2px 2px 1px -2px,
            rgba(0, 0, 0, 0.08) 1px 0 0 0,
            rgba(0, 0, 0, 0.05) -1px 1px 1px 1px !important;
        }
        &:last-child {
          box-shadow:
            rgba(0, 0, 0, 0.25) -2px 3px 1px -2px,
            rgba(0, 0, 0, 0.08) 1px 4px 2px 0,
            rgba(0, 0, 0, 0.05) -1px 1px 1px 1px !important;
        }
      }
    }
  }
</style>
