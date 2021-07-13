<template>
  <v-sheet class="h-full">
    <Navbar :map-id="mapId" />
    <Map :map-id="mapId" :starting-map-name="startingMapName" v-if="configLoaded" />

    <DraggableWindowManagerComponent />
    <Popover />
  </v-sheet>
</template>


<script>
  import Vue from 'vue';
  import { v4 as uuid } from 'uuid';
  import { addConfigToContext, createVcsApp, setPluginUiComponents } from '@/context';
  import config from '@/../map.config.json';

  import {
    onBeforeMount,
    onUnmounted,
    provide,
    reactive,
    ref,
  } from '@vue/composition-api';
  import { DraggableWindowManager } from '@/modules/draggable-window/draggable-window.manager';
  import DraggableWindowManagerComponent from '@/modules/draggable-window/DraggableWindowManager.vue';
  import { PopoverManager } from '@/modules/popover/popover.manager';
  import Popover from '@/modules/popover/PopoverManager.vue';
  import Navbar from './Navbar.vue';
  import Map from './Map.vue';


  export default Vue.extend({
    components: {
      Navbar,
      Map,
      DraggableWindowManagerComponent,
      Popover,
    },
    setup() {
      const id = uuid();
      const mapState = {
        maps: reactive([]),
        activeMap: ref(undefined),
      };

      const pluginComponents = {
        mapButtons: reactive([]),
        treeButtons: reactive([]),
        headerButtons: reactive([]),
      };

      const context = createVcsApp();

      const mapActivatedDestroy = context.maps.mapActivated.addEventListener((map) => {
        mapState.activeMap = map.className;
      });

      const mapAddedDestroy = context.maps.added.addEventListener(({ className, name }) => {
        mapState.maps.push({ className, name });
      });

      provide('context', context);
      provide('mapState', mapState);
      provide('pluginComponents', pluginComponents);

      const popoverManager = new PopoverManager();
      provide('popoverManager', popoverManager);
      const draggableWindowManager = new DraggableWindowManager();
      provide('draggableWindowManager', draggableWindowManager);

      const configLoaded = ref(false);
      const startingMapName = ref('');

      onBeforeMount(async () => {
        const startingMap = await addConfigToContext(config, context);
        startingMapName.value = startingMap.name;
        configLoaded.value = true;
        await setPluginUiComponents(context, pluginComponents);
      });

      onUnmounted(() => {
        if (mapActivatedDestroy) { mapActivatedDestroy(); }
        if (mapAddedDestroy) { mapAddedDestroy(); }
      });

      return {
        mapId: `mapCollection-${id}`,
        startingMapName,
        configLoaded,
      };
    },
    provide() {
      return {
        language: window.navigator.language.split('-')[0],
      };
    },
  });
</script>
