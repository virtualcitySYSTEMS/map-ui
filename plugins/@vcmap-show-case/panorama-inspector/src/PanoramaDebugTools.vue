<script setup>
  import { inject, onUnmounted, ref, shallowRef, watch } from 'vue';
  import { VcsCheckbox, VcsFormSection, VcsLabel, VcsSlider } from '@vcmap/ui';
  import { Color } from '@vcmap-cesium/engine';
  import {
    VContainer,
    VRow,
    VCol,
    VColorPicker,
    VMenu,
    VCard,
  } from 'vuetify/components';
  import {
    cesiumColorToColor,
    getStringColor,
    PanoramaOverlayMode,
  } from '@vcmap/core';
  import {
    createMapMarkerAction,
    createGlobeToggleAction,
    setupClickedPrimitive,
  } from './api.js';
  import { name } from '../package.json';

  const app = inject('vcsApp');
  /** @type {import("@vcmap/core").PanoramaMap} */
  const map = app.maps.activeMap; // better be a panorama map;
  const clickedPrimitive = setupClickedPrimitive(
    map,
    app.plugins.getByKey(name).clickedInteraction,
  );

  const showClickedPosition = ref(false);
  watch(showClickedPosition, (newShowClickedPosition) => {
    clickedPrimitive.show = newShowClickedPosition;
  });

  const { scene } = map.getCesiumWidget();
  const enableCesiumInteraction = ref(
    scene.screenSpaceCameraController.enableInputs,
  );

  watch(enableCesiumInteraction, (newEnableCesiumInteraction) => {
    scene.screenSpaceCameraController.enableInputs = newEnableCesiumInteraction;

    if (!newEnableCesiumInteraction) {
      scene.camera.setView({
        destination: map.currentPanoramaImage.position,
        orientation: map.currentPanoramaImage.orientation,
      });
    }
  });

  const action = createGlobeToggleAction(app);
  const { action: hideMarker, destroy: destroyMarker } =
    createMapMarkerAction(app);

  const suspendTileLoading = ref(map.panoramaView.suspendTileLoading);
  watch(suspendTileLoading, (newSuspendTileLoading) => {
    map.panoramaView.suspendTileLoading = newSuspendTileLoading;
  });

  const opacity = ref(map.panoramaView.tilePrimitiveCollection.opacity);
  watch(opacity, (newOpacity) => {
    map.panoramaView.tilePrimitiveCollection.opacity = newOpacity;
  });

  const overlayOpacity = ref(
    map.panoramaView.tilePrimitiveCollection.overlayOpacity,
  );
  watch(overlayOpacity, (newOverlayOpacity) => {
    map.panoramaView.tilePrimitiveCollection.overlayOpacity = newOverlayOpacity;
  });

  const contrast = ref(map.panoramaView.tilePrimitiveCollection.contrast);
  watch(contrast, (newContrast) => {
    map.panoramaView.tilePrimitiveCollection.contrast = newContrast;
  });

  const brightness = ref(map.panoramaView.tilePrimitiveCollection.brightness);
  watch(brightness, (newBrightness) => {
    map.panoramaView.tilePrimitiveCollection.brightness = newBrightness;
  });

  const overlayNaNColor = shallowRef(
    getStringColor(
      cesiumColorToColor(
        map.panoramaView.tilePrimitiveCollection.overlayNaNColor,
      ),
    ),
  );
  watch(overlayNaNColor, (newOverlayNaNColor) => {
    map.panoramaView.tilePrimitiveCollection.overlayNaNColor =
      Color.fromCssColorString(newOverlayNaNColor);
  });

  const cursorColor = shallowRef(
    getStringColor(
      cesiumColorToColor(map.panoramaView.tilePrimitiveCollection.cursorColor),
    ),
  );
  watch(cursorColor, (newCursorColor) => {
    map.panoramaView.tilePrimitiveCollection.cursorColor =
      Color.fromCssColorString(newCursorColor);
  });

  const showIntensity = ref(
    map.panoramaView.tilePrimitiveCollection.overlay ===
      PanoramaOverlayMode.Intensity,
  );
  const showDepth = ref(
    map.panoramaView.tilePrimitiveCollection.overlay ===
      PanoramaOverlayMode.Depth,
  );

  watch(showIntensity, (newShowIntensity) => {
    if (newShowIntensity) {
      showDepth.value = false;
      map.panoramaView.tilePrimitiveCollection.overlay =
        PanoramaOverlayMode.Intensity;
    } else if (!showDepth.value) {
      map.panoramaView.tilePrimitiveCollection.overlay =
        PanoramaOverlayMode.None;
    }
  });

  watch(showDepth, (newShowDepth) => {
    if (newShowDepth) {
      showIntensity.value = false;
      map.panoramaView.tilePrimitiveCollection.overlay =
        PanoramaOverlayMode.Depth;
    } else if (!showIntensity.value) {
      map.panoramaView.tilePrimitiveCollection.overlay =
        PanoramaOverlayMode.None;
    }
  });

  const showDebug = ref(map.panoramaView.tilePrimitiveCollection.showDebug);
  watch(showDebug, (newShowDebug) => {
    map.panoramaView.tilePrimitiveCollection.showDebug = newShowDebug;
  });

  onUnmounted(() => {
    clickedPrimitive.destroy();
    destroyMarker();
    map.panoramaView.tilePrimitiveCollection.opacity = 1;
  });
</script>

<template>
  <vcs-form-section
    heading="Tools"
    expandable
    :header-actions="[action, hideMarker]"
  >
    <v-container class="py-0 px-1">
      <v-row no-gutters>
        <v-col>
          <VcsCheckbox label="Show Debug" v-model="showDebug"></VcsCheckbox>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsCheckbox
            label="Show Intensity"
            v-model="showIntensity"
          ></VcsCheckbox>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsCheckbox label="Show Depth" v-model="showDepth"></VcsCheckbox>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col cols="4">
          <vcs-label>Brightness</vcs-label>
        </v-col>
        <v-col>
          <vcs-slider v-model="brightness" :min="-1" :max="1" :step="0.001" />
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col cols="4">
          <vcs-label>Contrast</vcs-label>
        </v-col>
        <v-col>
          <vcs-slider v-model="contrast" :min="0" :max="20" :step="0.01" />
        </v-col>
      </v-row>
      <template v-if="showDepth || showIntensity">
        <v-row no-gutters>
          <v-col cols="4">
            <vcs-label>Overlay Opacity</vcs-label>
          </v-col>
          <v-col>
            <vcs-slider
              v-model="overlayOpacity"
              :min="0"
              :max="1"
              :step="0.01"
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <vcs-label>Overlay NaN Color</vcs-label>
          </v-col>
          <v-col>
            <v-menu :close-on-content-click="false">
              <template #activator="{ props }">
                <v-card
                  rounded
                  height="24px"
                  width="32px"
                  v-bind="props"
                  :style="{ backgroundColor: overlayNaNColor }"
                />
              </template>
              <v-color-picker
                v-model="overlayNaNColor"
                mode="rgba"
                width="100%"
              />
            </v-menu>
          </v-col>
        </v-row>
      </template>
      <v-row no-gutters>
        <v-col>
          <vcs-label>Cursor Color</vcs-label>
        </v-col>
        <v-col>
          <v-menu :close-on-content-click="false">
            <template #activator="{ props }">
              <v-card
                rounded
                height="24px"
                width="32px"
                v-bind="props"
                :style="{ backgroundColor: cursorColor }"
              />
            </template>
            <v-color-picker v-model="cursorColor" mode="rgba" width="100%" />
          </v-menu>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsCheckbox
            label="Enable Cesium Interaction"
            v-model="enableCesiumInteraction"
          ></VcsCheckbox>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsCheckbox
            label="Show Clicked"
            v-model="showClickedPosition"
          ></VcsCheckbox>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col>
          <VcsCheckbox
            label="Suspend Tile Loading"
            v-model="suspendTileLoading"
          ></VcsCheckbox>
        </v-col>
      </v-row>
      <v-row no-gutters>
        <v-col cols="4">
          <vcs-label>Opacity</vcs-label>
        </v-col>
        <v-col>
          <vcs-slider v-model="opacity" :min="0" :max="1" :step="0.01" />
        </v-col>
      </v-row>
    </v-container>
  </vcs-form-section>
</template>

<style scoped lang="scss"></style>
