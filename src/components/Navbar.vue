<template>
  <v-app-bar dense class="z-index-100">
    <v-container fluid class="pa-0">
      <v-row no-gutters>
        <v-col>
          <v-toolbar-items>
            <div v-if="mapState" class="d-flex align-center">
              <Button
                v-for="map of mapState.maps"
                :key="map.name"
                :toggleable="true"
                :icon="iconMap[map.className]"
                @click.native="setMap(map.name)"
                :value="mapState.activeMap === map.name"
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

  export default Vue.extend({
    name: 'VcsNavbar',
    components: { Button },
    props: {
      mapId: {
        type: String,
        required: true,
      },
    },
    setup() {
      return {
        iconMap: {
          'vcs.vcm.maps.Openlayers': '$vcs2d',
          'vcs.vcm.maps.Cesium': '$vcs3d',
          'vcs.vcm.maps.Oblique': '$vcsObliqueView',
        },
      };
    },
    inject: ['context'],
    computed: {
      mapState() {
        return this.$store.state[this.mapId];
      },
    },
    methods: {
      /**
       * @function
       * @param {string} mapName
       * @description
       * Sets the current map type
       */
      setMap(mapName) {
        this.context.mapCollection.setActiveMap(mapName);
      },
    },
  });
</script>
