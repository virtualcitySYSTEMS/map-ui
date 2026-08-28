<template>
  <div class="vcs-main-map">
    <VcsMap :map-id="mapId" />
    <MapNavigation v-if="showMapNavigation" />
    <div
      :id="overviewMapContainerId"
      class="overviewmap-container"
      :class="xs || mobileLandscape ? 'mobile' : ''"
      :style="{ display: overviewMapState ? 'block' : 'none' }"
    />
  </div>
</template>

<script lang="ts">
  import type { ComputedRef } from 'vue';
  import {
    computed,
    defineComponent,
    inject,
    onMounted,
    onUnmounted,
    ref,
  } from 'vue';
  import { v4 as uuid } from 'uuid';
  import { useDisplay } from 'vuetify';
  import type VcsUiApp from '../vcsUiApp.js';
  import VcsMap from './VcsMap.ts.vue';
  import MapNavigation from '../navigation/MapNavigation.ts.vue';
  import { overviewMapContainerId } from '../navigation/overviewMap.js';
  import { isMobileLandscape } from '../vuePlugins/vuetify.js';

  export function setupMapNavigation(app: VcsUiApp): {
    showMapNavigation: ComputedRef<boolean>;
    destroy: () => void;
  } {
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
      showMapNavigation: computed(
        () => mapSize.value > 0 && !app.uiConfig.config.hideMapNavigation,
      ),
      destroy: (): void => {
        listeners.forEach((cb) => {
          cb();
        });
      },
    };
  }

  /**
   * @description Wrapper component for a VcsMap providing the map element.
   * @vue-prop {string} mapId - The id of the map, which is rendered in the map element's canvas
   */
  export default defineComponent({
    name: 'VcsMainMap',
    components: {
      MapNavigation,
      VcsMap,
    },
    setup() {
      const app = inject('vcsApp') as VcsUiApp;
      const id = uuid();
      const mapId = `mapCollection-${id}`;

      const mobileLandscape = isMobileLandscape();
      const { xs } = useDisplay();

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
        overviewMapContainerId,
        overviewMapState: app.overviewMap.currentState,
        mobileLandscape,
        xs,
      };
    },
  });
</script>

<style lang="scss" scoped>
  .overviewmap-container {
    position: absolute;
    right: 100px;
    bottom: 25px;
    width: 300px;
    height: 240px;
    background: rgb(var(--v-theme-surface));
    border: 3px solid rgb(var(--v-theme-surface));
    border-radius: 3px;
    &.mobile {
      width: 100%;
      right: 0px;
      bottom: 0px;
      border-radius: 0px;
    }
  }

  :deep(.overviewMapElement) {
    width: 100%;
    height: 100%;
  }
</style>
