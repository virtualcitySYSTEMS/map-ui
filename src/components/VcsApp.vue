<template>
  <v-sheet class="h-full">
    <Navbar :map-id="mapId" />
    <Map :map-id="mapId" :config="config" />
    <LayerTree />
    <Popover
      v-if="popover"
      :popover="popover"
    />
  </v-sheet>
</template>


<script>
  import Vue from 'vue';
  import { v4 as uuid } from 'uuid';
  import { createContext } from '@/context';
  import config from '@/../map.config.json';

  import VueCompositionApi, { reactive, ref } from '@vue/composition-api';
  import { draggableWindowState } from '@/modules/draggable-window/draggable-window.store';
  import Navbar from './Navbar.vue';
  import Map from './Map.vue';
  import Popover from './Popover.vue';
  import LayerTree from './LayerTree.vue';

  Vue.use(VueCompositionApi);

  /**
   * @description
   * Encapsulates map and navigation functionality and config.
   */

  const popover = reactive({
    component: undefined,
    coordinates: undefined,
    callback: undefined,
    attrs: undefined,
  });
  export default Vue.extend({
    components: {
      Navbar,
      Map,
      LayerTree,
      Popover,
    },
    setup() {
      const id = uuid();
      return {
        mapId: `mapCollection-${id}`,
        config,
        popover,
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
        popover,
      };
    },
  });
</script>
