<template>
  <div :id="mapId" />
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

    .cesium-widget,
    .cesium-widget canvas {
      width: 100%;
      height: 100%;
      touch-action: none;
    }
  }

</style>

<script >

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
