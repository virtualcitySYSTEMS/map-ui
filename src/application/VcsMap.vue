<template>
  <div
    :id="mapId"
    @click.right.stop="
      (e) => {
        e.preventDefault();
      }
    "
  />
</template>

<style lang="scss" scoped>
  ::v-deep {
    .mapElement {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      overflow: hidden; /* Fix for iFrame content */
    }

    .overviewMapElement {
      position: absolute;
      top: 3px;
      bottom: 3px;
      left: 3px;
      right: 3px;
      overflow: hidden; /* Fix for iFrame content */
    }

    .cesium-widget,
    .cesium-widget canvas {
      width: 100%;
      height: 100%;
      touch-action: none;
    }
  }
</style>

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
