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
  import { computed, inject, ref, onUnmounted } from '@vue/composition-api';
  import { ObliqueMap, CesiumMap, OpenlayersMap } from '@vcmap/core';
  import { unByKey } from 'ol/Observable.js';
  import { createOverviewMapAction } from '../actions/actionHelper.js';
  import { getWindowComponentOptions } from './overviewMap.js';
  import VcsCompass from './vcsCompass.vue';
  import VcsZoomButton from './vcsZoomButton.vue';
  import TiltSlider from './tiltSlider.vue';
  import ObliqueRotation from './obliqueRotation.vue';
  import OrientationToolsButton from './orientationToolsButton.vue';

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
    } else if (map instanceof ObliqueMap || map instanceof OpenlayersMap) {
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
      OrientationToolsButton,
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

      const { action, destroy } = createOverviewMapAction(
        app.overviewMap,
        getWindowComponentOptions(),
        app.windowManager,
      );

      onUnmounted(() => {
        if (destroy) {
          destroy();
        }
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
        overviewAction: ref(action),
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
    &.mobile{
      top: 1rem;
      right: 1rem;
      bottom: auto;
    }
  }
  .nav-container > {
    .row {
      margin-bottom: 15px;
    }
  }
</style>
