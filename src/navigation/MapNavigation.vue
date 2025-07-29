<template>
  <v-container
    :class="
      xs || mobileLandscape ? 'nav-container mobile no-zoom ' : 'nav-container'
    "
    class="map-navigation"
  >
    <v-row>
      <VcsCompass
        :view-mode="viewMode"
        v-model="heading"
        :disabled="movementApiCallsDisabled"
      />
    </v-row>
    <v-row v-if="isOblique">
      <ObliqueRotation v-model="heading" :disabled="movementApiCallsDisabled" />
    </v-row>
    <template v-if="mobile">
      <v-row justify="center">
        <OrientationToolsButton
          v-if="showLocatorButton"
          :icon="locatorAction.icon"
          :tooltip="locatorAction.title"
          :color="locatorAction.active ? 'primary' : undefined"
          @click.stop="locatorAction.callback($event)"
          :disabled="movementApiCallsDisabled"
        ></OrientationToolsButton>
      </v-row>
    </template>
    <template v-if="smAndUp && !mobileLandscape">
      <v-row justify="center">
        <VcsZoomButton
          @zoom-out="zoomOut()"
          @zoom-in="zoomIn()"
          :disabled="movementApiCallsDisabled"
        />
      </v-row>
      <v-row justify="center" v-if="is3D || isPanorama">
        <TiltSlider
          v-model="tilt"
          :disabled="movementApiCallsDisabled"
          :max-tilt="isPanorama ? 89 : undefined"
          :min-tilt="isPanorama ? -89 : undefined"
        />
      </v-row>
      <v-row v-if="!hideRotationButton && is3D" justify="center">
        <OrientationToolsButton
          :icon="rotationAction.icon"
          :tooltip="rotationAction.title"
          :color="rotationAction.active ? 'primary' : undefined"
          @click.stop="rotationAction.callback($event)"
          :disabled="rotationAction.disabled"
        />
      </v-row>
    </template>
    <v-row justify="center">
      <OrientationToolsButton
        v-if="homeAction.icon"
        :icon="homeAction.icon"
        :tooltip="homeAction.title"
        @click.stop="homeAction.callback($event)"
        :disabled="movementApiCallsDisabled"
      />
    </v-row>
    <template v-if="!mobileLandscape">
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
  import {
    ObliqueMap,
    CesiumMap,
    ObliqueViewDirection,
    startRotation,
    rotationMapControlSymbol,
    PanoramaMap,
  } from '@vcmap/core';
  import { VContainer, VRow } from 'vuetify/components';
  import { useDisplay } from 'vuetify';
  import { Math as CesiumMath } from '@vcmap-cesium/engine';
  import { createOverviewMapAction } from '../actions/actionHelper.js';
  import { createLocatorAction } from './locatorHelper.js';
  import {
    getWindowComponentOptions,
    overviewMapLayerSymbol,
  } from './overviewMap.js';
  import VcsCompass from './VcsCompass.vue';
  import VcsZoomButton from './VcsZoomButton.vue';
  import TiltSlider from './TiltSlider.vue';
  import ObliqueRotation from './ObliqueRotation.vue';
  import OrientationToolsButton from './OrientationToolsButton.vue';
  import { isMobileLandscape } from '../vuePlugins/vuetify.js';

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
        if (defaultViewpoint?.isValid()) {
          listener();
        }
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
        const vp = getStartingViewpoint() || defaultViewpoint;
        if (app.maps.activeMap && vp?.isValid()) {
          await app.maps.activeMap.gotoViewpoint(vp);
        }
      },
    });

    return { action, destroy: () => listener?.() };
  }

  /**
   * @description Creates a rotate-around-center action to continuously rotate the viewpoint around the current map center at a specified speed. The action can be toggled on or off.
   * @param {import("@src/vcsUiApp.js").default} app - The app instance containing the active map.
   * @param {import("vue").ComputedRef<number>} defaultTimePerRotation - A computed property representing the time it takes to complete one rotation. The value should be a number representing seconds per rotation. Default is 60 seconds per rotation.
   * @returns {{ action: import("vue").Reactive<VcsAction>, destroy: function():void }} - Returns the rotation action and a destroy method to stop the rotation listener if active.
   */
  function setupRotationButton(app, defaultTimePerRotation) {
    let stopRotation;
    const action = reactive({
      name: 'rotate-action',
      title: 'navigation.rotateButton',
      icon: '$vcsView360',
      active: false,
      callback: async () => {
        if (action.active) {
          if (stopRotation) {
            stopRotation();
          } else {
            app.maps.resetExclusiveMapControls();
          }
        } else {
          stopRotation = await startRotation(
            app,
            undefined,
            defaultTimePerRotation.value,
          );
        }
      },
    });

    const rotationListener =
      app.maps.exclusiveMapControlsChanged.addEventListener((eventData) => {
        const { options, id } = eventData;
        action.active =
          id === rotationMapControlSymbol &&
          options.keyEvents === true &&
          options.apiCalls === true &&
          options.pointerEvents === true;
        action.disabled =
          id !== rotationMapControlSymbol &&
          options.keyEvents === true &&
          options.apiCalls === true &&
          options.pointerEvents === true;

        stopRotation = null;
      });
    return {
      action,
      destroy: () => {
        stopRotation?.();
        rotationListener();
      },
    };
  }

  /**
   * @enum {string}
   */
  const OrientationToolsViewMode = {
    THREE_D: '3d',
    TWO_D: '2d',
    OBLIQUE: 'oblique',
    PANORAMA: 'panorama',
  };

  function getViewModeForMap(map) {
    if (map instanceof ObliqueMap) {
      return OrientationToolsViewMode.OBLIQUE;
    } else if (map instanceof CesiumMap) {
      return OrientationToolsViewMode.THREE_D;
    } else if (map instanceof PanoramaMap) {
      return OrientationToolsViewMode.PANORAMA;
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
    if (map instanceof PanoramaMap) {
      if (out) {
        map.panoramaCameraController.zoomOut();
      } else {
        map.panoramaCameraController.zoomIn();
      }
    } else {
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
  }

  /**
   * @param {import("@src/vcsUiApp.js").default} app
   * @param {import("vue").Ref} isDisabled
   * @returns {() => void}
   */
  function setupMovementDisabledListener(app, isDisabled) {
    let movementDisabledListener = () => {};
    const mapActivatedListener = app.maps.mapActivated.addEventListener(
      (map) => {
        movementDisabledListener();
        isDisabled.value = map.movementApiCallsDisabled;
        movementDisabledListener = map.movementDisabledChanged.addEventListener(
          (mapControlOptions) => {
            isDisabled.value = mapControlOptions.apiCalls;
          },
        );
      },
    );
    return () => {
      movementDisabledListener();
      mapActivatedListener();
    };
  }

  /**
   * @enum {number}
   */
  const directionToDegrees = {
    [ObliqueViewDirection.NORTH]: 0,
    [ObliqueViewDirection.EAST]: 90,
    [ObliqueViewDirection.SOUTH]: 180,
    [ObliqueViewDirection.WEST]: 270,
  };

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
      const mobileLandscape = isMobileLandscape();

      const handleRenderEvent = ({ map }) => {
        viewMode.value = getViewModeForMap(map);
        if (map instanceof ObliqueMap && map.currentImage) {
          headingRef.value = map.currentImage.viewDirectionAngle
            ? 90 - CesiumMath.toDegrees(map.currentImage.viewDirectionAngle)
            : directionToDegrees[map.currentImage.viewDirection];
        } else {
          const vp = map.getViewpointSync();
          if (vp) {
            headingRef.value = vp.heading;
            tiltRef.value = vp.pitch;
          }
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
          if (app.maps.activeMap instanceof PanoramaMap) {
            const { camera } = app.maps.activeMap.getCesiumWidget();
            camera.setView({
              orientation: {
                heading: CesiumMath.toRadians(headingValue),
                pitch: camera.pitch,
                roll: camera.roll,
              },
            });
          } else {
            const vp = await app.maps.activeMap.getViewpoint();
            delete vp.cameraPosition;
            vp.heading = headingValue;
            vp.animate = true;
            app.maps.activeMap.gotoViewpoint(vp);
          }
        },
      });

      const tilt = computed({
        get() {
          return tiltRef.value;
        },
        set(tiltValue) {
          if (app.maps.activeMap instanceof PanoramaMap) {
            const { camera } = app.maps.activeMap.getCesiumWidget();
            camera.setView({
              orientation: {
                heading: camera.heading,
                pitch: CesiumMath.toRadians(tiltValue),
                roll: camera.roll,
              },
            });
          } else {
            const vp = app.maps.activeMap.getViewpointSync(); // XXX make async and debounce
            vp.pitch = tiltValue;
            app.maps.activeMap.gotoViewpoint(vp);
          }
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

      // Locator
      const { action: locatorAction, destroy: destroyLocator } =
        createLocatorAction(app);

      const showLocatorButton = computed(() => {
        return app.uiConfig.config.showLocator ?? true;
      });

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

      const movementApiCallsDisabled = ref(
        !!app.maps.activeMap?.movementApiCallsDisabled,
      );
      const removeMovementDisabledListener = setupMovementDisabledListener(
        app,
        movementApiCallsDisabled,
      );

      const { action: homeAction, destroy: homeDestroy } = setupHomeButton(app);

      const defaultTimePerRotation = computed(() => {
        return app.uiConfig.config?.timePerRotation;
      });

      const { action: rotationAction, destroy: rotationDestroy } =
        setupRotationButton(app, defaultTimePerRotation);

      const hideRotationButton = computed(() => {
        return app.uiConfig.config?.hideRotationButton;
      });

      onUnmounted(() => {
        if (overviewDestroy) {
          overviewDestroy();
        }
        if (destroyLocator) {
          destroyLocator();
        }
        if (homeDestroy) {
          homeDestroy();
        }
        rotationDestroy();
        postRenderHandler();
        overviewMapListeners.forEach((cb) => cb());
        removeMovementDisabledListener();
      });

      const { xs, mobile, smAndUp } = useDisplay();

      return {
        xs,
        smAndUp,
        mobile,
        viewMode,
        heading,
        tilt,
        is3D: computed(
          () => viewMode.value === OrientationToolsViewMode.THREE_D,
        ),
        isOblique: computed(
          () => viewMode.value === OrientationToolsViewMode.OBLIQUE,
        ),
        isPanorama: computed(
          () => viewMode.value === OrientationToolsViewMode.PANORAMA,
        ),
        zoomIn() {
          zoom(app.maps.activeMap);
        }, // debounce?
        zoomOut() {
          zoom(app.maps.activeMap, true);
        },
        overviewAction: reactive(overviewAction),
        locatorAction: reactive(locatorAction),
        showOverviewButton,
        showLocatorButton,
        hideRotationButton,
        homeAction,
        rotationAction,
        movementApiCallsDisabled,
        mobileLandscape,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .nav-container {
    position: absolute;
    right: 26px;
    // right: 26px --> the 2rem were 26px in the old map, now 32px ?Important?
    bottom: 13px;
    // bottom: 13px --> the 1rem were 13px in the old map, now 16px ?Important?
    width: unset;
    padding: 12px;
    &.mobile {
      // same height as mobile Icon
      padding-top: 0px;
      right: 1rem;
      bottom: auto;
    }
  }
  .nav-container > {
    .v-row {
      margin-top: 15px;
      margin-bottom: 0;
    }
  }
  .no-zoom {
    touch-action: none; /* Disable gestures like pinch and double-tap zoom */
  }
</style>
