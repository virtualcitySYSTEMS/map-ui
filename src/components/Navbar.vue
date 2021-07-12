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
              <NavbarDivider />
              <Button
                :icon="'$vcsLayers'"
                @click.native="toggleLayerTree()"
                :value="!!draggableWindows['layer-tree']"
              />
              <Button
                :icon="'$$vcsComponents'"
                @click.native="toggleComponents()"
                :value="!!draggableWindows['components']"
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

  import LayerTree from '@/components/LayerTree.vue';
  import Button from '@vcsuite/uicomponents/Button.vue';
  import NavbarDivider from '@vcsuite/uicomponents/NavbarDivider.vue';
  import VueCompositionAPI, { inject } from '@vue/composition-api';
  import { DRAGGABLE_WINDOW_POSITIONS } from '@/modules/draggable-window/draggable-window.manager';

  Vue.use(VueCompositionAPI);
  Vue.component('LayerTree', LayerTree);

  const layerTree = {
    id: 'layer-tree',
    component: 'LayerTree',
    width: 320,
    header: 'layer-tree.title',
    icon: '$vcsLayers',
    position: DRAGGABLE_WINDOW_POSITIONS.topLeft,
    defaultPosition: DRAGGABLE_WINDOW_POSITIONS.topLeft,
  };

  const components = {
    id: 'components',
    component: 'LayerTree',
    width: 320,
    header: 'components.title',
    icon: '$vcsLayers',
    position: DRAGGABLE_WINDOW_POSITIONS.bottomRight,
    defaultPosition: DRAGGABLE_WINDOW_POSITIONS.bottomRight,
  };


  export default Vue.extend({
    name: 'VcsNavbar',
    components: { Button, NavbarDivider },
    props: {
      mapId: {
        type: String,
        required: true,
      },
    },
    setup() {
      const mapState = inject('mapState');
      const draggableWindowManager = inject('draggableWindowManager');
      const context = inject('context');

      const iconMap = {
        'vcs.vcm.maps.Openlayers': '$vcs2d',
        'vcs.vcm.maps.Cesium': '$vcs3d',
        'vcs.vcm.maps.Oblique': '$vcsObliqueView',
      };
      /**
       * @param {string} mapName
       */
      const setMap = (mapName) => {
        context.maps.setActiveMap(mapName);
      };

      const toggleLayerTree = () => {
        draggableWindowManager.toggle(layerTree);
      };
      const toggleComponents = () => {
        draggableWindowManager.toggle(components);
      };

      return {
        iconMap,
        maps: mapState.maps,
        mapState,
        setMap,
        toggleLayerTree,
        toggleComponents,
        draggableWindows: draggableWindowManager.state.items,
      };
    },
  });
</script>
