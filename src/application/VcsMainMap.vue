<template>
  <div>
    <VcsMap :map-id="mapId" />
    <MapNavigation v-if="showMapNavigation" />
  </div>
</template>

<style lang="scss" scoped></style>

<script>
  import { inject, onMounted, onUnmounted, ref, computed } from 'vue';
  import { v4 as uuid } from 'uuid';
  import MapNavigation from '../navigation/MapNavigation.vue';
  import VcsMap from './VcsMap.vue';

  export function setupMapNavigation(app) {
    const mapSize = ref(app.maps.size);

    const listeners = [
      app.maps.added.addEventListener(() => {
        mapSize.value = app.maps.size;
      }),
      app.maps.removed.addEventListener(() => {
        mapSize.value = app.maps.size;
      }),
    ];

    return {
      showMapNavigation: computed(() => {
        return mapSize.value > 0 && !app.uiConfig.config.hideMapNavigation;
      }),
      destroy: () => {
        listeners.forEach((cb) => cb());
      },
    };
  }

  /**
   * @description Wrapper component for a VcsMap providing the map element.
   * @vue-prop {string} mapId - The id of the map, which is rendered in the map element's canvas
   */
  export default {
    name: 'VcsMainMap',
    components: {
      MapNavigation,
      VcsMap,
    },
    setup() {
      const app = inject('vcsApp');
      const id = uuid();
      const mapId = `mapCollection-${id}`;

      const { showMapNavigation, destroy: destroyMapNavigationListener } =
        setupMapNavigation(app);

      onMounted(() => {
        app.maps.setTarget(mapId);
        app.mounted.raiseEvent(mapId);
      });

      onUnmounted(() => {
        destroyMapNavigationListener();
      });

      return {
        mapId,
        showMapNavigation,
      };
    },
  };
</script>
