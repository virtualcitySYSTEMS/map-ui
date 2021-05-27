<template>
  <v-sheet class="h-full">
    <Navbar :map-id="mapId" />
    <Map :map-id="mapId" :config="config" />
  </v-sheet>
</template>


<script>
  import Vue from 'vue';
  import { v4 as uuid } from 'uuid';
  import MapCollection from '@vcmap/core/src/vcs/vcm/util/mapCollection';

  import Navbar from './Navbar.vue';
  import Map from './Map.vue';

  /**
   * @description
   * Encapsulates map and navigation functionality and config.
   */
  export default Vue.extend({
    components: {
      Navbar,
      Map,
    },
    setup() {
      return {
        mapId: `mapCollection-${uuid()}`,
        config: {
          initialMap: {
            activeMap: 'openlayers',
            viewPointConfig: {
              name: 'Berlin',
              distance: 157.3489399067245,
              cameraPosition: [
                13.411394127432544,
                52.497745299212546,
                119.75750333776946,
              ],
              groundPosition: [
                13.411253398151665,
                52.498931077538636,
                34.57404938876193,
              ],
              heading: 355.85726724381027,
              pitch: -32.777305832704,
              roll: 359.98398234382154,
            },
          },
          openLayersConfig: {
            name: 'openlayers',
          },
          osmConfig: {},
          projectionConfig: {
            epsg: 25833,
            proj4: '+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs',
          },
          obliqueCollectionConfig: {
            name: 'berlin',
            dataSetUrls: ['https://a.3d.blc.shc.eu/WAB/base_layer/obliques/image.json'],
          },
          obliqueMapConfig: {
            name: 'oblique',
          },
          cesiumMapConfig: {
            name: 'cesium',
          },
        },
      };
    },
    provide() {
      return {
        context: {
          mapCollection: new MapCollection(),
        },
      };
    },
  });
</script>
