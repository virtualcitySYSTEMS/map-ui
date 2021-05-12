<template>
  <v-sheet class="h-full">
    <Navbar :map-id="mapId" />

    <Map :map-id="mapId" />
  </v-sheet>
</template>


<script>
  import Vue from 'vue';

  import { v4 as uuid } from 'uuid';
  import Navbar from './Navbar.vue';
  import Map from './Map.vue';

  export default Vue.extend({
    components: {
      Navbar,
      Map,
    },
    data() {
      return {
        mapId: `mapCollection-${uuid()}`,
      };
    },
    mounted() {

    },
  });
</script>
