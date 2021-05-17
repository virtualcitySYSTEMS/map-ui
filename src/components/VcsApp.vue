<template>
  <v-sheet class="h-full">
    <Navbar :map-id="$options.mapId" />

    <Map :map-id="$options.mapId" :map-config="$options.initialMapConfig" />
  </v-sheet>
</template>


<script>
  import Vue from 'vue';
  import { v4 as uuid } from 'uuid';
  import ViewPoint from '@vcmap/core/src/vcs/vcm/util/viewpoint';

  import Navbar from './Navbar.vue';
  import Map from './Map.vue';

  export default Vue.extend({
    components: {
      Navbar,
      Map,
    },
    mapId: `mapCollection-${uuid()}`,
    initialMapConfig: {
      activeMap: 'openlayers',
      viewPoint: new ViewPoint({
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
      }),
    },
  });
</script>
