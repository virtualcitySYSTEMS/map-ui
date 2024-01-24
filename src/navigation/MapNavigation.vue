<template>
  <v-container
    :class="$vuetify.breakpoint.xs ? 'nav-container mobile' : 'nav-container'"
  >
    <v-row>
      <VcsCompass :view-mode="viewMode" v-model="heading" />
    </v-row>
    <v-row v-if="isOblique">
      <ObliqueRotation v-model="heading" />
    </v-row>
    <template v-if="$vuetify.breakpoint.mdAndUp">
      <v-row justify="center">
        <VcsZoomButton @zoom-out="zoomOut()" @zoom-in="zoomIn()" />
      </v-row>
      <v-row justify="center" v-if="is3D && $vuetify.breakpoint.mdAndUp">
        <TiltSlider v-model="tilt" />
      </v-row>
      <v-row justify="center">
        <OrientationToolsButton
          v-if="homeAction.icon"
          :icon="homeAction.icon"
          :tooltip="homeAction.title"
          @click.stop="homeAction.callback($event)"
        />
      </v-row>
      <v-row justify="center">
        <OrientationToolsButton
          v-if="showOverviewButton"
          :icon="overviewAction.icon"
          :tooltip="overviewAction.title"
          :color="overviewAction.active ? 'primary' : undefined"
          @click.stop="overviewAction.callback($event)"
        />
      </v-row>
    </template>
  </v-container>
</template>

<script>
  import { computed, inject, ref, reactive, onUnmounted } from 'vue';
  import { ObliqueMap, CesiumMap } from '@vcmap/core';
  import { VContainer, VRow } from 'vuetify/lib';
  import { createOverviewMapAction } from '../actions/actionHelper.js';
  import {
    getWindowComponentOptions,
    overviewMapLayerSymbol,
  } from './overviewMap.js';
  import VcsCompass from './VcsCompass.vue';
  import VcsZoomButton from './VcsZoomButton.vue';
  import TiltSlider from './TiltSlider.vue';
  import ObliqueRotation from './ObliqueRotation.vue';
  import OrientationToolsButton from './OrientationToolsButton.vue';

  /**
   * @description Creates a go-to viewpoint action from a startingViewpointName defined in a module. If no startingViewpointName is defined, uses default map view as fallback.
   * @param {import("@src/vcsUiApp.js").default} app
   * @returns {{ action: import("vue").Reactive<VcsAction>, destroy: function():void }}
   */
  function setupHomeButton(app) {
    let defaultViewpoint;
    let listener;
    if (app.maps.activeMap) {
      defaultViewpoint = app.maps.activeMap?.getViewpointSync();
    } else {
      listener = app.maps.mapActivated.addEventListener((map) => {
        defaultViewpoint = map.getViewpointSync();
        listener();
      });
    }

    const getStartingViewpoint = () => {
      let viewpoint;
      for (let idx = app.modules.length - 1; idx >= 0; idx--) {
        const { startingViewpointName } = app.modules[idx].config;
        if (
          startingViewpointName &&
          app.viewpoints.hasKey(startingViewpointName)
        ) {
          viewpoint = app.viewpoints.getByKey(startingViewpointName);
          break;
        }
      }
      return viewpoint;
    };

    const action = reactive({
      name: 'home-action',
      title: 'navigation.homeButton',
      icon: '$vcsHomePoint',
      async callback() {
        await app.maps.activeMap?.gotoViewpoint(
          getStartingViewpoint() || defaultViewpoint,
        );
      },
    });

    return { action, destroy: () => listener?.() };
  }

  /**
   * @enum {string}
   */
  const OrientationToolsViewMode = {
    THREE_D: '3d',
    TWO_D: '2d',
    OBLIQUE: 'oblique',
  };

  function getViewModeForMap(map) {
    if (map instanceof ObliqueMap) {
      return OrientationToolsViewMode.OBLIQUE;
    } else if (map instanceof CesiumMap) {
      return OrientationToolsViewMode.THREE_D;
    }
    return OrientationToolsViewMode.TWO_D;
  }

  /**
   * @param {VcsMap} map
   * @param {boolean} [out=false]
   * @param {number} [zoomFactor]
   * @returns {Promise<void>}
   */
  async function zoom(map, out = false, zoomFactor = 2) {
    const viewpoint = await map.getViewpoint();
    if (out) {
      viewpoint.distance *= zoomFactor;
    } else {
      viewpoint.distance /= zoomFactor;
    }
    viewpoint.animate = true;
    viewpoint.duration = 0.5;
    viewpoint.cameraPosition = null;
    await map.gotoViewpoint(viewpoint);
  }

  export default {
    components: {
      OrientationToolsButton,
      ObliqueRotation,
      TiltSlider,
      VcsZoomButton,
      VcsCompass,
      VContainer,
      VRow,
    },
    setup() {
      /** @type {import("@src/vcsUiApp.js").default} */
      const app = inject('vcsApp');
      const viewMode = ref(OrientationToolsViewMode.TWO_D);
      const headingRef = ref(0);
      const tiltRef = ref(0);

      const handleRenderEvent = ({ map }) => {
        viewMode.value = getViewModeForMap(map);
        const vp = map.getViewpointSync();
        if (vp) {
          headingRef.value = vp.heading;
          tiltRef.value = vp.pitch;
        }
      };

      const postRenderHandler =
        app.maps.postRender.addEventListener(handleRenderEvent);
      if (app.maps.activeMap) {
        handleRenderEvent({ map: app.maps.activeMap });
      }
      const heading = computed({
        get() {
          return headingRef.value;
        },
        async set(headingValue) {
          let vp;
          if (viewMode.value === OrientationToolsViewMode.OBLIQUE) {
            vp = await app.maps.activeMap.getViewpoint();
          } else {
            vp = app.maps.activeMap.getViewpointSync();
          }
          vp.heading = headingValue;
          app.maps.activeMap.gotoViewpoint(vp);
        },
      });

      const tilt = computed({
        get() {
          return tiltRef.value;
        },
        set(tiltValue) {
          const vp = app.maps.activeMap.getViewpointSync(); // XXX make async and debounce
          vp.pitch = tiltValue;
          app.maps.activeMap.gotoViewpoint(vp);
        },
      });

      const { action: overviewAction, destroy: overviewDestroy } =
        createOverviewMapAction(
          app.overviewMap,
          getWindowComponentOptions(),
          app.windowManager,
        );
      const showOverviewButton = ref(
        app.overviewMap.map.layerCollection.size > 0,
      );
      const overviewMapListeners = [
        app.overviewMap.map.layerCollection.added.addEventListener(() => {
          showOverviewButton.value = true;
        }),
        app.overviewMap.map.layerCollection.removed.addEventListener(() => {
          if (
            [...app.overviewMap.map.layerCollection].filter(
              (l) => !l[overviewMapLayerSymbol],
            ).length < 1 &&
            app.overviewMap.active
          ) {
            app.overviewMap.deactivate();
            showOverviewButton.value = false;
          }
        }),
      ];

      const { action: homeAction, destroy: homeDestroy } = setupHomeButton(app);

      onUnmounted(() => {
        if (overviewDestroy) {
          overviewDestroy();
        }
        if (homeDestroy) {
          homeDestroy();
        }
        postRenderHandler();
        overviewMapListeners.forEach((cb) => cb());
      });

      return {
        viewMode,
        heading,
        tilt,
        is3D: computed(
          () => viewMode.value === OrientationToolsViewMode.THREE_D,
        ),
        isOblique: computed(
          () => viewMode.value === OrientationToolsViewMode.OBLIQUE,
        ),
        zoomIn() {
          zoom(app.maps.activeMap);
        }, // debounce?
        zoomOut() {
          zoom(app.maps.activeMap, true);
        },
        overviewAction: reactive(overviewAction),
        showOverviewButton,
        homeAction,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .nav-container {
    position: absolute;
    right: 2rem;
    bottom: 1rem;
    width: unset;
    &.mobile {
      top: 1rem;
      right: 1rem;
      bottom: auto;
    }
  }
  .nav-container > {
    .row {
      margin-top: 15px;
      margin-bottom: 0;
    }
  }
</style>
