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
                v-for="windowComponentOption in windowComponentOptions"
                :key="windowComponentOption.id"
                :component-name="windowComponentOption.id"
                :window-state="getWindowComponentState(windowComponentOption.id)"
                :icon="windowComponentOption.state.headerIcon"
                @toggle="toggle(windowComponentOption.id)"
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
  import { windowSlot } from '@/modules/window-manager/windowManager.js';
  import ComponentToggleButton from './ComponentToggleButton.vue';
  import EmptyCmp from './empty-cmp.vue';

  const staticWindow = {
    id: 'static-win',
    state: {
      headerIcon: '$vcsLayers',
      styles: {
        'max-width': '80%',
      },
    },
    position: {
      width: window.innerWidth * 0.8,
      left: '10%',
      right: '10%',
      top: '10%',
      bottom: '10%',
    },
    component: EmptyCmp,
  };

  const layerTree = {
    id: 'layer-tree',
    component: LayerTree,
    state: {
      headerTitle: 'Static Window',
      headerIcon: '$vcsLayers',
    },
    position: {
      width: 320,
    },
    windowSlot: windowSlot.STATIC,
  };

  const components = {
    id: 'components',
    component: LayerTree,
    state: {
      headerTitle: 'Dynamic Window Left 1',
      headerIcon: '$vcsComponents',
    },
    position: {
      width: 320,
    },
    windowSlot: windowSlot.DYNAMIC_LEFT,
  };

  const dummy1 = {
    ...components,
    id: 'dummy1',
    state: {
      ...components.state,
      headerTitle: 'Dynamic Window Left (2)',
      headerIcon: '$vcsTools',
    },
    windowSlot: windowSlot.DYNAMIC_LEFT,
  };

  const dummy2 = {
    ...dummy1,
    id: 'dummy2',
    state: {
      ...dummy1.state,
      headerTitle: 'Dynamic Window Right',

      headerIcon: '$vcsLegend',
    },
    windowSlot: windowSlot.DYNAMIC_RIGHT,
  };

  const windowComponentOptions = [
    layerTree,
    components,
    dummy1,
    dummy2,
    staticWindow,
  ];


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
      const windowManager = inject('windowManager');
      const app = inject('vcsApp');

      const getWindowComponentState = (id) => {
        return windowManager.has(id);
      };

      const toggle = (id) => {
        if (windowManager.has(id)) {
          windowManager.remove(id);
        } else {
          const windowComponentOption = windowComponentOptions.find(item => item.id === id);
          if (windowComponentOption) {
            windowManager.add(windowComponentOption);
          }
        }
      };


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
        getWindowComponentState,
        toggle,
        setMap,
        windowComponentOptions,
      };
    },
  });
</script>
