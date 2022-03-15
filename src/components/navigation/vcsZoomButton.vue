<template>
  <div>
    <OrientationToolsButton
      @click="$emit('zoom-in')"
      icon="$vcsPlus"
      tooltip="Zoom in"
    />
    <OrientationToolsButton
      @click="$emit('zoom-out')"
      icon="$vcsMinus"
      tooltip="Zoom out"
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
