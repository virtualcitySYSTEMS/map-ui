<template>
  <v-sheet class="h-full">
    <Navbar :map-id="mapId" />
    <Map :map-id="mapId" :config="config" />
    <LayerTree />
  </v-sheet>
</template>


<script>
  import Vue from 'vue';
  import { v4 as uuid } from 'uuid';
  import { createContext } from '@/context';
  import config from '@/../map.config.json';

  import { reactive, ref } from '@vue/composition-api';
  import { draggableWindowState } from '@/modules/draggable-window/draggable-window.store';
  import Navbar from './Navbar.vue';
  import Map from './Map.vue';
  import LayerTree from './LayerTree.vue';

  /**
   * @description
   * Encapsulates map and navigation functionality and config.
   */
  export default Vue.extend({
    components: {
      Navbar,
      Map,
      LayerTree,
    },
    setup() {
      const id = uuid();
      return {
        mapId: `mapCollection-${id}`,
        config,
      };
    },
    provide() {
      return {
        /** @type {Context} */
        context: createContext(),
        mapState: {
          maps: reactive([]),
          activeMap: ref(undefined),
        },
        draggableWindowState: reactive(draggableWindowState),
      };
    },
  });
</script>
