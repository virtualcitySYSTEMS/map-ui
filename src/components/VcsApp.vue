<template>
  <v-sheet class="h-full">
    <Navbar :map-id="mapId" />
    <Map :map-id="mapId" :config="config" />
  </v-sheet>
</template>


<script>
  import Vue from 'vue';
  import { v4 as uuid } from 'uuid';
  import { createContext } from '@/context';
  import config from '@/../map.config.json';

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
        config,
      };
    },
    provide() {
      return {
        /** @type {Context} */
        context: createContext(),
      };
    },
  });
</script>
