<template>
  <div>
    <VcsMap :map-id="mapId" />
    <MapNavigation v-if="showMapNavigation" />
  </div>
</template>

<style lang="scss" scoped></style>

<script>
  import { inject, onMounted, onUnmounted, ref } from 'vue';
  import { v4 as uuid } from 'uuid';
  import MapNavigation from '../navigation/MapNavigation.vue';
  import VcsMap from './VcsMap.vue';

  export function setupMapNavigation(app) {
    const showMapNavigation = ref(app.maps.size < 1);

    const listeners = [
      app.maps.added.addEventListener(() => {
        showMapNavigation.value = true;
      }),
      app.maps.removed.addEventListener(() => {
        if (app.maps.size < 1) {
          showMapNavigation.value = false;
        }
      }),
    ];

    return {
      showMapNavigation,
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
    components: { MapNavigation, VcsMap },
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
