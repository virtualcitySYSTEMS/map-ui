<template>
  <v-container class="nav-container">
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
    <v-row justify="center">
      <VcsZoomButton
        @zoom-out="zoomOut()"
        @zoom-in="zoomIn()"
      />
    </v-row>
    <v-row v-if="is3D" justify="center">
      <TiltSlider v-model="tilt" />
    </v-row>
  </v-container>
</template>

<script>
  import { computed, inject, ref } from '@vue/composition-api';
  import { Oblique, CesiumMap, Openlayers } from '@vcmap/core';
  import { unByKey } from 'ol/Observable.js';
  import VcsCompass from './vcsCompass.vue';
  import VcsZoomButton from './vcsZoomButton.vue';
  import TiltSlider from './tiltSlider.vue';
  import ObliqueRotation from './obliqueRotation.vue';

  /**
   * @enum {string}
   */
  const OrientationToolsViewMode = {
    THREE_D: '3d',
    TWO_D: '2d',
    OBLIQUE: 'oblique',
  };

  function getViewModeForMap(map) {
    if (map instanceof Oblique) {
      return OrientationToolsViewMode.OBLIQUE;
    } else if (map instanceof CesiumMap) {
      return OrientationToolsViewMode.THREE_D;
    }
    return OrientationToolsViewMode.TWO_D;
  }

  /**
   * @param {VcsMap} map
   * @param {Ref<number>} headingRef
   * @param {Ref<number>} tiltRef
   * @returns {function():void}
   */
  function mapPostRender(map, headingRef, tiltRef) {
    const handler = () => {
      const vp = map.getViewPointSync();
      if (vp) {
        headingRef.value = vp.heading;
        tiltRef.value = vp.pitch;
      }
    };

    if (map instanceof CesiumMap) {
      return map.getScene().postRender.addEventListener(handler);
    } else if (map instanceof Oblique || map instanceof Openlayers) {
      const key = map.olMap.on('postrender', handler);
      return () => {
        unByKey(key);
      };
    }
    return () => {};
  }

  /**
   * @param {VcsMap} map
   * @param {boolean} [out=false]
   * @param {number} [zoomFactor]
   * @returns {Promise<void>}
   */
  async function zoom(map, out = false, zoomFactor = 2) {
    const viewpoint = await map.getViewPoint();
    if (out) {
      viewpoint.distance *= zoomFactor;
    } else {
      viewpoint.distance /= zoomFactor;
    }
    viewpoint.animate = true;
    viewpoint.duration = 0.5;
    viewpoint.cameraPosition = null;
    await map.gotoViewPoint(viewpoint);
  }

  export default {
    components: {
      ObliqueRotation,
      TiltSlider,
      VcsZoomButton,
      VcsCompass,
    },
    setup() {
      /** @type {VcsApp} */
      const app = inject('vcsApp');
      const viewMode = ref(OrientationToolsViewMode.TWO_D);
      const headingRef = ref(0);
      const tiltRef = ref(0);

      let postRenderHandler = () => {};

      const setActiveMap = (map) => {
        viewMode.value = getViewModeForMap(map);
        postRenderHandler();
        postRenderHandler = mapPostRender(map, headingRef, tiltRef);
      };

      app.maps.mapActivated.addEventListener(setActiveMap);
      setActiveMap(app.maps.activeMap);

      const heading = computed({
        get() { return headingRef.value; },
        async set(headingValue) {
          let vp;
          if (viewMode.value === OrientationToolsViewMode.OBLIQUE) {
            vp = await app.maps.activeMap.getViewPoint();
          } else {
            vp = app.maps.activeMap.getViewPointSync();
          }
          vp.heading = headingValue;
          app.maps.activeMap.gotoViewPoint(vp);
        },
      });

      const tilt = computed({
        get() { return tiltRef.value; },
        set(tiltValue) {
          const vp = app.maps.activeMap.getViewPointSync(); // XXX make async and debounce
          vp.pitch = tiltValue;
          app.maps.activeMap.gotoViewPoint(vp);
        },
      });

      return {
        viewMode,
        heading,
        tilt,
        is3D: computed(() => viewMode.value === OrientationToolsViewMode.THREE_D),
        isOblique: computed(() => viewMode.value === OrientationToolsViewMode.OBLIQUE),
        zoomIn() { zoom(app.maps.activeMap); }, // debounce?
        zoomOut() { zoom(app.maps.activeMap, true); },
        left: () => {},
        right: () => {},
      };
    },
  };
</script>

<style lang="scss" scoped>
  .nav-container {
    position: absolute;
    right: 2rem;
    bottom: 2rem;
    width: unset;
  }

  .nav-container > {
    .row {
      margin-bottom: 15px;
    }
  }
</style>
