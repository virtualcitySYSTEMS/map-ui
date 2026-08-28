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
      <v-row class="justify-center">
        <OrientationToolsButton
          v-if="showLocatorButton"
          :icon="locatorAction.icon!"
          :tooltip="locatorAction.title!"
          :color="locatorAction.active ? 'primary' : undefined"
          @click.stop="locatorAction.callback($event)"
          :disabled="movementApiCallsDisabled"
        ></OrientationToolsButton>
      </v-row>
    </template>
    <template v-if="smAndUp && !mobileLandscape">
      <v-row class="justify-center">
        <VcsZoomButton
          @zoom-out="zoomOut()"
          @zoom-in="zoomIn()"
          :disabled="movementApiCallsDisabled"
        />
      </v-row>
      <v-row class="justify-center" v-if="is3D || isPanorama">
        <TiltSlider
          v-model="tilt"
          :disabled="movementApiCallsDisabled"
          :max-tilt="isPanorama ? 89 : undefined"
          :min-tilt="isPanorama ? -89 : undefined"
        />
      </v-row>
      <v-row v-if="!hideRotationButton && is3D" class="justify-center">
        <OrientationToolsButton
          :icon="rotationAction.icon!"
          :tooltip="rotationAction.title!"
          :color="rotationAction.active ? 'primary' : undefined"
          @click.stop="rotationAction.callback($event)"
          :disabled="rotationAction.disabled"
        />
      </v-row>
    </template>
    <v-row class="justify-center">
      <OrientationToolsButton
        v-if="homeAction.icon"
        :icon="homeAction.icon"
        :tooltip="homeAction.title!"
        @click.stop="homeAction.callback($event)"
        :disabled="movementApiCallsDisabled"
      />
    </v-row>
    <template v-if="!mobileLandscape">
      <v-row class="justify-center">
        <OrientationToolsButton
          v-if="showOverviewButton"
          icon="$vcsMap"
          tooltip="navigation.overviewMapTooltip"
          :color="overviewMapState ? 'primary' : undefined"
          @click.stop="toggleOverviewMap"
        />
      </v-row>
    </template>
  </v-container>
</template>

<script lang="ts">
  import type { ComputedRef, Ref } from 'vue';
  import {
    computed,
    defineComponent,
    inject,
    ref,
    reactive,
    onUnmounted,
  } from 'vue';
  import type { Viewpoint, VcsMap } from '@vcmap/core';
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
  import type VcsUiApp from '../vcsUiApp.js';
  import { createLocatorAction } from './locatorHelper.js';
  import { overviewMapLayerSymbol } from './overviewMap.js';
  import VcsCompass from './VcsCompass.ts.vue';
  import VcsZoomButton from './VcsZoomButton.ts.vue';
  import TiltSlider from './TiltSlider.ts.vue';
  import ObliqueRotation from './ObliqueRotation.ts.vue';
  import OrientationToolsButton from './OrientationToolsButton.ts.vue';
  import { isMobileLandscape } from '../vuePlugins/vuetify.js';
  import type {
    VcsAction,
    DestroyableAction,
  } from '../actions/actionHelper.js';

  /**
   * @description Creates a go-to viewpoint action from a startingViewpointName defined in a module. If no startingViewpointName is defined, uses default map view as fallback.
   */
  function setupHomeButton(app: VcsUiApp): DestroyableAction {
    let defaultViewpoint: Viewpoint | null = null;
    let listener: (() => void) | undefined;
    if (app.maps.activeMap) {
      defaultViewpoint = app.maps.activeMap?.getViewpointSync();
    } else {
      listener = app.maps.mapActivated.addEventListener((map): void => {
        defaultViewpoint = map.getViewpointSync();
        if (defaultViewpoint?.isValid()) {
          listener?.();
        }
      });
    }

    const getStartingViewpoint = (): Viewpoint | undefined => {
      let viewpoint: Viewpoint | undefined;
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
      async callback(): Promise<void> {
        const vp = getStartingViewpoint() || defaultViewpoint;
        if (app.maps.activeMap && vp?.isValid()) {
          await app.maps.activeMap.gotoViewpoint(vp);
        }
      },
    });

    return { action, destroy: (): void => listener?.() };
  }

  /**
   * @description Creates a rotate-around-center action to continuously rotate the viewpoint around the current map center at a specified speed. The action can be toggled on or off.
   * @param app - The app instance containing the active map.
   * @param defaultTimePerRotation - A computed property representing the time it takes to complete one rotation. The value should be a number representing seconds per rotation. Default is 60 seconds per rotation.
   * @returns - Returns the rotation action and a destroy method to stop the rotation listener if active.
   */
  function setupRotationButton(
    app: VcsUiApp,
    defaultTimePerRotation: ComputedRef<number>,
  ): DestroyableAction {
    let stopRotation: (() => void) | null = null;
    const action = reactive<VcsAction>({
      name: 'rotate-action',
      title: 'navigation.rotateButton',
      icon: '$vcsView360',
      active: false,
      callback: async (): Promise<void> => {
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
          options.keyEvents &&
          options.apiCalls &&
          options.pointerEvents;
        action.disabled =
          id !== rotationMapControlSymbol &&
          options.keyEvents &&
          options.apiCalls &&
          options.pointerEvents;

        stopRotation = null;
      });
    return {
      action,
      destroy: (): void => {
        stopRotation?.();
        rotationListener();
      },
    };
  }

  export enum OrientationToolsViewMode {
    THREE_D = '3d',
    TWO_D = '2d',
    OBLIQUE = 'oblique',
    PANORAMA = 'panorama',
  }

  function getViewModeForMap(map: VcsMap): OrientationToolsViewMode {
    if (map instanceof ObliqueMap) {
      return OrientationToolsViewMode.OBLIQUE;
    } else if (map instanceof CesiumMap) {
      return OrientationToolsViewMode.THREE_D;
    } else if (map instanceof PanoramaMap) {
      return OrientationToolsViewMode.PANORAMA;
    }
    return OrientationToolsViewMode.TWO_D;
  }

  async function zoom(map: VcsMap, out = false, zoomFactor = 2): Promise<void> {
    if (map instanceof PanoramaMap) {
      if (out) {
        map.panoramaCameraController.zoomOut();
      } else {
        map.panoramaCameraController.zoomIn();
      }
    } else {
      const viewpoint = await map.getViewpoint();
      if (viewpoint) {
        if (out) {
          viewpoint.distance! *= zoomFactor;
        } else {
          viewpoint.distance! /= zoomFactor;
        }
        viewpoint.animate = true;
        viewpoint.duration = 0.5;
        viewpoint.cameraPosition = null;
        await map.gotoViewpoint(viewpoint);
      }
    }
  }

  function setupMovementDisabledListener(
    app: VcsUiApp,
    isDisabled: Ref<boolean>,
  ): () => void {
    let movementDisabledListener = (): void => {};
    const mapActivatedListener = app.maps.mapActivated.addEventListener(
      (map): void => {
        movementDisabledListener();
        isDisabled.value = map.movementApiCallsDisabled;
        movementDisabledListener = map.movementDisabledChanged.addEventListener(
          (mapControlOptions): void => {
            isDisabled.value = mapControlOptions.apiCalls;
          },
        );
      },
    );
    return (): void => {
      movementDisabledListener();
      mapActivatedListener();
    };
  }

  const directionToDegrees: Record<ObliqueViewDirection, number> = {
    [ObliqueViewDirection.NADIR]: 0,
    [ObliqueViewDirection.NORTH]: 0,
    [ObliqueViewDirection.EAST]: 90,
    [ObliqueViewDirection.SOUTH]: 180,
    [ObliqueViewDirection.WEST]: 270,
  };

  export default defineComponent({
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
      const app = inject<VcsUiApp>('vcsApp')!;
      const viewMode = ref(OrientationToolsViewMode.TWO_D);
      const headingRef = ref(0);
      const tiltRef = ref(0);
      const mobileLandscape = isMobileLandscape();

      const handleRenderEvent = ({ map }: { map: VcsMap }): void => {
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
        set(headingValue): void {
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
            app.maps.activeMap
              ?.getViewpoint()
              .then((vp) => {
                if (vp) {
                  vp.cameraPosition = null;
                  vp.heading = headingValue;
                  vp.animate = true;
                  app.maps.activeMap?.gotoViewpoint(vp).catch(() => {});
                }
              })
              .catch(() => {});
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
            const vp = app.maps.activeMap?.getViewpointSync(); // XXX make async and debounce
            if (vp) {
              vp.pitch = tiltValue;
              app.maps.activeMap?.gotoViewpoint(vp).catch(() => {});
            }
          }
        },
      });

      const showOverviewButton = ref(
        app.overviewMap.map.layerCollection.size > 0,
      );
      const toggleOverviewMap = async (): Promise<void> => {
        if (app.overviewMap.currentState.value) {
          app.overviewMap.deactivate();
        } else {
          await app.overviewMap.activate();
        }
      };

      const overviewMapListeners = [
        app.overviewMap.map.layerCollection.added.addEventListener(() => {
          showOverviewButton.value = true;
        }),
        app.overviewMap.map.layerCollection.removed.addEventListener(() => {
          if (
            [...app.overviewMap.map.layerCollection].filter(
              // @ts-expect-error overviewMapLayerSymbol is not a property of VectorLayer
              (l) => !l[overviewMapLayerSymbol],
            ).length < 1 &&
            app.overviewMap.active
          ) {
            app.overviewMap.deactivate();
            showOverviewButton.value = false;
          }
        }),
      ];

      // Locator
      const { action: locatorAction, destroy: destroyLocator } =
        createLocatorAction(app);

      const showLocatorButton = computed(() => {
        return app.uiConfig.config.showLocator ?? true;
      });

      const movementApiCallsDisabled = ref(
        !!app.maps.activeMap?.movementApiCallsDisabled,
      );
      const removeMovementDisabledListener = setupMovementDisabledListener(
        app,
        movementApiCallsDisabled,
      );

      const { action: homeAction, destroy: homeDestroy } = setupHomeButton(app);

      const defaultTimePerRotation = computed(
        () => app.uiConfig.config?.timePerRotation ?? 60,
      );

      const { action: rotationAction, destroy: rotationDestroy } =
        setupRotationButton(app, defaultTimePerRotation);

      const hideRotationButton = computed(() => {
        return app.uiConfig.config?.hideRotationButton;
      });

      onUnmounted(() => {
        if (destroyLocator) {
          destroyLocator();
        }
        if (homeDestroy) {
          homeDestroy();
        }
        rotationDestroy();
        postRenderHandler();
        overviewMapListeners.forEach((cb) => {
          cb();
        });
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
        async zoomIn(): Promise<void> {
          await zoom(app.maps.activeMap!);
        }, // debounce?
        async zoomOut(): Promise<void> {
          await zoom(app.maps.activeMap!, true);
        },
        locatorAction: reactive(locatorAction),
        showOverviewButton,
        showLocatorButton,
        hideRotationButton,
        homeAction,
        rotationAction,
        movementApiCallsDisabled,
        mobileLandscape,
        overviewMapState: app.overviewMap.currentState,
        toggleOverviewMap,
      };
    },
  });
</script>

<style lang="scss" scoped>
  .nav-container {
    position: absolute;
    right: 26px;
    // right: 26px --> the 2rem were 26px in the old map, now 32px ?Important?
    bottom: 13px;
    // bottom: 13px --> the 1rem were 13px in the old map, now 16px ?Important?
    width: unset;
    padding: 12px 0;
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
