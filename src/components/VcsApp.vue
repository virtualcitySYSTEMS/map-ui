<template>
  <v-sheet class="h-full">
    <Navbar :map-id="mapId" />
    <Map :map-id="mapId" :config="config" />

    <DraggableWindowManagerComponent />
    <Popover />
  </v-sheet>
</template>


<script>
  import Vue from 'vue';
  import { v4 as uuid } from 'uuid';
  import { createVcsApp, getContextById } from '@/context';
  import config from '@/../map.config.json';

  import VueCompositionApi, { provide, reactive, ref } from '@vue/composition-api';
  import { DraggableWindowManager } from '@/modules/draggable-window/draggable-window.manager';
  import DraggableWindowManagerComponent from '@/modules/draggable-window/DraggableWindowManager.vue';
  import { PopoverManager } from '@/modules/popover/popover.manager';
  import Popover from '@/modules/popover/Popover.vue';
  import Navbar from './Navbar.vue';
  import Map from './Map.vue';

  Vue.use(VueCompositionApi);

  export default Vue.extend({
    components: {
      Navbar,
      Map,
      DraggableWindowManagerComponent,
      Popover,
    },
    setup() {
      const id = uuid();

      createVcsApp();

      const firstApp = Array.from(window.vcs.apps.keys())[0];
      const context = getContextById(firstApp);
      provide('context', context);

      const popoverManager = new PopoverManager();
      provide('popoverManager', popoverManager);
      const draggableWindowManager = new DraggableWindowManager();
      provide('draggableWindowManager', draggableWindowManager);


      return {
        mapId: `mapCollection-${id}`,
        config,
      };
    },
    provide() {
      return {
        mapState: {
          maps: reactive([]),
          activeMap: ref(undefined),
        },
        language: window.navigator.language.split('-')[0],
      };
    },
  });
</script>
