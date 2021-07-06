<template>
  <div class="map_container" :id="mapId" />
</template>

<style lang="scss" scoped>

  .map_container {
    height: 100%;
    overflow: hidden;
    position: relative;
    background-color: #fff;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 8 8'%3E%3Cg fill='%23acacac' fill-opacity='0.4'%3E%3Cpath fill-rule='evenodd' d='M0 0h4v4H0V0zm4 4h4v4H4V4z'/%3E%3C/g%3E%3C/svg%3E");
    font-family: Arial, sans-serif;
    font-size: 0.9rem;
  }

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
  import Vue from 'vue';
  import VueCompositionAPI, { defineComponent, inject, onMounted } from '@vue/composition-api';

  Vue.use(VueCompositionAPI);

  export default defineComponent({
    props: {
      mapId: {
        type: String,
        required: true,
      },
      startingMapName: {
        type: String,
        default: '',
      },
    },
    setup(props) {
      const context = inject('context');

      /**
       * @function
       * @description Initializes the map from configuration.
       */
      onMounted(async () => {
        context.maps.setTarget(props.mapId);

        await context.maps.setActiveMap(props.startingMapName || [...context.maps][0].name);
        await context.maps.activeMap.gotoViewPoint(context.startViewPoint);
      });
    },
  });
</script>
