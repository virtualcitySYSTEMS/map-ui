<template>
  <v-sheet class="h-full">
    <Navbar :map-id="mapId" />
    <VcsMap :map-id="mapId" />
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
  import VcsApp, { setPluginUiComponents } from '@/vcsApp.js';
  import { WindowManager } from '@/modules/window-manager/windowManager.js';
  import WindowManagerComponent from '@/modules/window-manager/WindowManager.vue';
  import { PopoverManager } from '@/modules/popover-manager/popover.manager.js';
  import Popover from '@/modules/popover-manager/PopoverManager.vue';
  import { ToolboxManager } from '@/modules/toolbox-manager/toolbox-manager.js';
  import ToolboxManagerComponent from '@/modules/toolbox-manager/ToolboxManager.vue';
  import Navbar from './Navbar.vue';
  import VcsMap from './VcsMap.vue';
  import Context from '@/context.js';

  export default Vue.extend({
    components: {
      Navbar,
      VcsMap,
      WindowManagerComponent,
      ToolboxManagerComponent,
      Popover,
    },
    props: {
      config: {
        type: String,
        default: '../map.config.json',
      },
    },
    setup(props) {
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

      const app = new VcsApp();

      const mapActivatedDestroy = app.maps.mapActivated.addEventListener(
        (map) => {
          mapState.activeMap = map.className;
        },
      );

      const mapAddedDestroy = app.maps.added.addEventListener(
        ({ className, name }) => {
          mapState.maps.push({
            className,
            name,
          });
        },
      );

      provide('vcsApp', app);
      provide('mapState', mapState);
      provide('pluginComponents', pluginComponents);

      /** Toolbox */
      app.toolboxManager = new ToolboxManager();
      provide('toolboxManager', app.toolboxManager);


      /** Popover */
      app.popoverManager = new PopoverManager();
      provide('popoverManager', app.popoverManager);

      /** Window */
      app.windowManager = new WindowManager();
      provide('windowManager', app.windowManager);

      onBeforeMount(async () => {
        const config = await fetch(props.config)
          .then(response => response.json());
        const context = new Context(config);
        await app.addContext(context);
        // XXX FIXME this flow is ugly and this does not work properly. fix with plugin manager
        await setPluginUiComponents(app, pluginComponents);

        // todo wait for Vue 3 and move into onMounted Hook, vue2 hooks are not async :(
        await Promise.all([...app.plugins].map(async (plugin) => {
          if (plugin.postUiInitialize) {
            await plugin.postUiInitialize();
          }
        }));
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
        toolboxManagerVisible: app.toolboxManager.state.visible,
      };
    },
    provide() {
      return {
        language: window.navigator.language.split('-')[0],
      };
    },
  });
</script>
