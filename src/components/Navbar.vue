<template>
  <v-app-bar dense class="z-index-100">
    <v-container fluid class="pa-0">
      <v-row no-gutters>
        <v-col>
          <v-toolbar-items>
            <div v-if="maps" class="d-flex align-center">
              <Button
                v-for="map of maps"
                :key="map.name"
                :toggleable="true"
                :icon="iconMap[map.className]"
                @click.native="setMap(map.name)"
                :value="mapState.activeMap === map.className"
              />
              <component
                v-for="(button, index) in mapButtons"
                :is="button"
                :key="`map-button-${index}`"
              />
              <NavbarDivider />
              <ComponentToggleButton
                v-for="windowState in windowStates"
                :key="windowState.id"
                :component-name="windowState.id"
                :window-state="windowState"
                :icon="windowState.icon"
              />
            </div>
          </v-toolbar-items>
        </v-col>
        <v-col class="align-center d-flex justify-center">
          <div class="company-logo" />
        </v-col>
        <v-col />
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<script>

  import Vue from 'vue';

  import Button from '@vcsuite/uicomponents/Button.vue';
  import NavbarDivider from '@vcsuite/uicomponents/NavbarDivider.vue';
  import { inject } from '@vue/composition-api';
  import LayerTree from '@/components/LayerTree.vue';
  import { WINDOW_SLOTS } from '@/modules/window-manager/window.manager.js';
  import PositionParser from '@/modules/window-manager/util/position-parser.js';
  import ComponentToggleButton from './ComponentToggleButton.vue';
  import EmptyCmp from './empty-cmp.vue';

  const staticPosition = new PositionParser({
    left: '10%',
    right: '10%',
    top: '10%',
    bottom: '10%',
  });

  const staticWindow = {
    id: 'static-win',
    width: window.innerWidth * 0.8,
    component: EmptyCmp,
    icon: '$vcsLayers',
    position: staticPosition,
    styles: {
      'max-width': '80%',
    },
  };

  const layerTree = {
    id: 'layer-tree',
    component: LayerTree,
    width: 320,
    header: 'Static Window',
    icon: '$vcsLayers',
    position: {},
    windowSlot: WINDOW_SLOTS.static,
    isDetached: false,
  };

  const components = {
    id: 'components',
    component: LayerTree,
    width: 320,
    header: 'Dynamic Window Left 1',
    icon: '$vcsComponents',
    position: {},
    windowSlot: WINDOW_SLOTS.dynamicLeft,
    isDetached: false,
  };

  const dummy1 = {
    ...components,
    id: 'dummy1',
    icon: '$vcsTools',
    windowSlot: WINDOW_SLOTS.dynamicLeft,
    header: 'Dynamic Window Left (2)',
    isDetached: false,
  };

  const dummy2 = {
    ...dummy1,
    header: 'Dynamic Window Right',
    id: 'dummy2',
    icon: '$vcsLegend',
    isDetached: false,
    windowSlot: WINDOW_SLOTS.dynamicRight,
  };

  const windowStates = {
    layerTree,
    components,
    dummy1,
    dummy2,
    staticWindow,
  };


  export default Vue.extend({
    name: 'VcsNavbar',
    components: { Button, NavbarDivider, ComponentToggleButton },
    props: {
      mapId: {
        type: String,
        required: true,
      },
    },
    setup() {
      const mapState = inject('mapState');
      const pluginComponents = inject('pluginComponents');
      const app = inject('vcsApp');

      const iconMap = {
        'vcs.vcm.maps.Openlayers': '$vcs2d',
        'vcs.vcm.maps.Cesium': '$vcs3d',
        'vcs.vcm.maps.Oblique': '$vcsObliqueView',
      };
      /**
       * @param {string} mapName
       */
      const setMap = (mapName) => {
        app.maps.setActiveMap(mapName);
      };
      return {
        mapButtons: pluginComponents.mapButtons,
        iconMap,
        maps: mapState.maps,
        mapState,
        setMap,
        windowStates,
      };
    },
  });
</script>
