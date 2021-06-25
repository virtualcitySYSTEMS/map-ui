<template>
  <v-sheet class="h-full">
    <Navbar :map-id="mapId" />
    <Map :map-id="mapId" :config="config" />
    <LayerTree />
    <Popover
      v-if="popoverState && popoverState.items.length"
      :popovers-state="popoverState"
    />
  </v-sheet>
</template>


<script>
  import Vue from 'vue';
  import { v4 as uuid } from 'uuid';
  import { createContext } from '@/context';
  import config from '@/../map.config.json';

  import VueCompositionApi, { provide, reactive, ref } from '@vue/composition-api';
  import { DraggableWindowManager } from '@/modules/draggable-window/draggable-window.manager';
  import { PopoverManager } from '@/modules/popover/popover.manager';
  import Navbar from './Navbar.vue';
  import Map from './Map.vue';
  import Popover from './Popover.vue';
  import LayerTree from './LayerTree.vue';

  Vue.use(VueCompositionApi);
  // eslint-disable-next-line no-underscore-dangle
  export default Vue.extend({
    components: {
      Navbar,
      Map,
      LayerTree,
      Popover,
    },
    setup() {
      const id = uuid();

      const popoverManager = new PopoverManager();
      provide('popoverManager', popoverManager);
      const popoverState = popoverManager.state;

      const draggableWindowManager = new DraggableWindowManager();
      const draggableWindowState = draggableWindowManager.state;
      provide('draggableWindowManager', draggableWindowManager);

      return {
        mapId: `mapCollection-${id}`,
        config,
        popoverState,
        draggableWindowState,
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
        language: window.navigator.language.split('-')[0],
      };
    },
  });
</script>
