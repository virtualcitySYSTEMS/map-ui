<template>
  <v-sheet class="h-full">
    <Navbar :map-id="mapId" />
    <VcsMap :map-id="mapId" :starting-map-name="startingMapName" v-if="configLoaded" />
    <transition name="slide-from-top-200-ease">
      <ToolboxManagerComponent v-if="toolboxManagerVisible" />
    </transition>

    <WindowManagerComponent />
    <Popover />
  </v-sheet>
</template>


<script>
  import Vue from 'vue';
  import { v4 as uuid } from 'uuid';
  import {
    onBeforeMount,
    onUnmounted,
    provide,
    reactive,
    ref,
  } from '@vue/composition-api';
  import { addConfigToContext, createVcsApp, setPluginUiComponents } from '@/context.js';
  import config from '@/../map.config.json';
  import { WindowManager } from '@/modules/window-manager/window.manager.js';
  import WindowManagerComponent from '@/modules/window-manager/WindowManager.vue';
  import { PopoverManager } from '@/modules/popover-manager/popover.manager.js';
  import Popover from '@/modules/popover-manager/PopoverManager.vue';
  import { ToolboxManager } from '@/modules/toolbox-manager/toolbox-manager.js';
  import ToolboxManagerComponent from '@/modules/toolbox-manager/ToolboxManager.vue';
  import Navbar from './Navbar.vue';
  import VcsMap from './VcsMap.vue';

  export default Vue.extend({
    components: {
      Navbar,
      VcsMap,
      WindowManagerComponent,
      ToolboxManagerComponent,
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

      const mapActivatedDestroy = context.maps.mapActivated.addEventListener(
        (map) => {
          mapState.activeMap = map.className;
        },
      );

      const mapAddedDestroy = context.maps.added.addEventListener(
        ({ className, name }) => {
          mapState.maps.push({
            className,
            name,
          });
        },
      );

      provide('context', context);
      provide('mapState', mapState);
      provide('pluginComponents', pluginComponents);

      /** Toolbox */
      const toolboxManager = new ToolboxManager();
      provide('toolboxManager', toolboxManager);


      /** Popover */
      const popoverManager = new PopoverManager();
      provide('popoverManager', popoverManager);

      /** Window */
      const windowManager = new WindowManager();
      provide('windowManager', windowManager);

      const configLoaded = ref(false);
      const startingMapName = ref('');

      onBeforeMount(async () => {
        const startingMap = await addConfigToContext(config, context);
        startingMapName.value = startingMap.name;
        configLoaded.value = true;
        await setPluginUiComponents(context, pluginComponents);
      });

      onUnmounted(() => {
        if (mapActivatedDestroy) {
          mapActivatedDestroy();
        }
        if (mapAddedDestroy) {
          mapAddedDestroy();
        }
      });

      return {
        mapId: `mapCollection-${id}`,
        startingMapName,
        configLoaded,
        toolboxManagerVisible: toolboxManager.state.visible,
      };
    },
    provide() {
      return {
        language: window.navigator.language.split('-')[0],
      };
    },
  });
</script>
