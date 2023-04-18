<template>
  <v-container :class="$vuetify.breakpoint.xs ? 'nav-container mobile' : 'nav-container'">
    <v-row>
      <VcsCompass
        :view-mode="viewMode"
        v-model="heading"
      />
    </v-row>
    <v-row
      v-if="isOblique"
    >
      <ObliqueRotation
        v-model="heading"
      />
    </v-row>
    <template v-if="$vuetify.breakpoint.mdAndUp">
      <v-row justify="center">
        <VcsZoomButton
          @zoom-out="zoomOut()"
          @zoom-in="zoomIn()"
        />
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
  import {
    computed, inject, ref, reactive, onUnmounted,
  } from 'vue';
  import { ObliqueMap, CesiumMap } from '@vcmap/core';
  import { VContainer, VRow } from 'vuetify/lib';
  import { createGoToViewpointAction, createOverviewMapAction } from '../actions/actionHelper.js';
  import { getWindowComponentOptions } from './overviewMap.js';
  import VcsCompass from './vcsCompass.vue';
  import VcsZoomButton from './vcsZoomButton.vue';
  import TiltSlider from './tiltSlider.vue';
  import ObliqueRotation from './obliqueRotation.vue';
  import OrientationToolsButton from './orientationToolsButton.vue';

  /**
   * Creates a go-to viewpoint action from a startingViewpointName defined in a module
   * @param {VcsUiApp} app
   * @returns {{action: import("vue").Reactive<{}>, destroy: function():void}}
   */
  function setupHomeButton(app) {
    const initialAction = { icon: undefined, title: undefined, active: undefined, callback: undefined };
    const action = reactive({ ...initialAction });
    /**
     * Gets the starting viewpoint of the last added module, where a startingViewpointName was defined
     * and sets it on the home button action.
     */
    const updateStartingViewpoint = () => {
      let viewpoint = null;
      for (let idx = app.modules.length - 1; idx >= 0; idx--) {
        const { startingViewpointName } = app.modules[idx].config;
        if (startingViewpointName && app.viewpoints.hasKey(startingViewpointName)) {
          viewpoint = app.viewpoints.getByKey(startingViewpointName);
          break;
        }
      }
      if (!viewpoint) {
        Object.assign(action, { ...initialAction });
      } else {
        Object.assign(action, createGoToViewpointAction(
          {
            name: 'home-action',
            title: 'navigation.homeButton',
            icon: '$vcsHomePoint',
          },
          viewpoint,
          app.viewpoints,
          app.maps,
        ));
      }
    };

    const listener = [
      app.moduleAdded.addEventListener(updateStartingViewpoint),
      app.moduleRemoved.addEventListener(updateStartingViewpoint),
    ];

    const destroy = () => { listener.forEach(cb => cb()); };

    return { action, destroy };
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
      /** @type {VcsUiApp} */
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

      const postRenderHandler = app.maps.postRender.addEventListener(handleRenderEvent);
      if (app.maps.activeMap) {
        handleRenderEvent({ map: app.maps.activeMap });
      }
      const heading = computed({
        get() { return headingRef.value; },
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
        get() { return tiltRef.value; },
        set(tiltValue) {
          const vp = app.maps.activeMap.getViewpointSync(); // XXX make async and debounce
          vp.pitch = tiltValue;
          app.maps.activeMap.gotoViewpoint(vp);
        },
      });

      const { action, destroy } = createOverviewMapAction(
        app.overviewMap,
        getWindowComponentOptions(),
        app.windowManager,
      );

      const { action: homeAction, destroy: homeDestroy } = setupHomeButton(app);

      onUnmounted(() => {
        if (destroy) {
          destroy();
        }
        postRenderHandler();
        homeDestroy();
      });

      return {
        viewMode,
        heading,
        tilt,
        is3D: computed(() => viewMode.value === OrientationToolsViewMode.THREE_D),
        isOblique: computed(() => viewMode.value === OrientationToolsViewMode.OBLIQUE),
        zoomIn() { zoom(app.maps.activeMap); }, // debounce?
        zoomOut() { zoom(app.maps.activeMap, true); },
        overviewAction: reactive(action),
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
    &.mobile{
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
