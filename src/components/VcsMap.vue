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
  import { defineComponent, inject, onMounted, isReactive } from '@vue/composition-api';
  import { getLogger as getLoggerByName } from '@vcsuite/logger';

  /**
   * @returns {Logger}
   */
  function getLogger() {
    return getLoggerByName('VcsMap');
  }


  export default defineComponent({
    props: {
      mapId: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const app = inject('vcsApp');

      onMounted(async () => {
        app.maps.setTarget(props.mapId);
        if (isReactive(app.maps.activeMap)) {
          getLogger().error('Map is reactive, PLEASE FIX');
        }
      });
    },
  });
</script>
