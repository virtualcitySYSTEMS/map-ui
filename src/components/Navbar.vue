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
                @click.native="toggleDraggableWindow('layer-tree')"
                :value="draggableWindows['layer-tree'] && draggableWindows['layer-tree'].visible"
              />
              <Button
                :icon="'$$vcsComponents'"
                @click.native="toggleDraggableWindow('components')"
                :value="draggableWindows['components'] && draggableWindows['components'].visible"
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
  import VueCompositionAPI, { inject } from '@vue/composition-api';

  Vue.use(VueCompositionAPI);


  export default Vue.extend({
    name: 'VcsNavbar',
    components: { Button, NavbarDivider },
    props: {
      mapId: {
        type: String,
        required: true,
      },
    },
    setup(props, ctx) {
      const mapState = inject('mapState');
      const draggableWindowManager = inject('draggableWindowManager');

      const iconMap = {
        'vcs.vcm.maps.Openlayers': '$vcs2d',
        'vcs.vcm.maps.Cesium': '$vcs3d',
        'vcs.vcm.maps.Oblique': '$vcsObliqueView',
      };
      const context = inject('context');
      /**
       * @function
       * @param {string} mapName
       * @description
       * Sets the current map type
       */
      const setMap = (mapName) => {
        context.maps.setActiveMap(mapName);
      };

      const toggleDraggableWindow = (viewId) => {
        draggableWindowManager.toggleViewVisible(viewId);
      };

      return {
        iconMap,
        setMap,
        maps: mapState.maps,
        mapState,
        toggleDraggableWindow,
        draggableWindows: draggableWindowManager.state.items,
      };
    },
  });
</script>
