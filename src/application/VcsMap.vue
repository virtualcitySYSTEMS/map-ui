<template>
  <div
    class="vcs-map"
    :id="mapId"
    @click.right.stop="
      (e) => {
        e.preventDefault();
      }
    "
  />
</template>

<script>
  /**
   * @description Wrapper component for a VcsMap providing the map element.
   * @vue-prop {string} mapId - The id of the map, which is rendered in the map element's canvas
   */
  export default {
    name: 'VcsMap',
    props: {
      mapId: {
        type: String,
        required: true,
      },
    },
  };
</script>

<style lang="scss" scoped>
  :deep(.mapElement) {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    overflow: hidden; /* Fix for iFrame content */
  }

  :deep(.cesium-widget),
  :deep(.cesium-widget canvas) {
    width: 100%;
    height: 100%;
    touch-action: none;
  }
</style>
