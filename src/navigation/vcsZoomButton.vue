<template>
  <div>
    <OrientationToolsButton
      @click="$emit('zoom-in')"
      icon="$vcsPlus"
      tooltip="navigation.zoomInTooltip"
    />
    <OrientationToolsButton
      @click="$emit('zoom-out')"
      icon="$vcsMinus"
      tooltip="navigation.zoomOutTooltip"
    />
  </div>
</template>

<script>
  import OrientationToolsButton from './orientationToolsButton.vue';

  /**
   * Zoom buttons rendered above each other.
   * @vue-event {void} zoom-in - raised when zoom in is called
   * @vue-event {void} zoom-out - raised when zoom out is called
   */
  export default {
    components: { OrientationToolsButton },
  };
</script>
