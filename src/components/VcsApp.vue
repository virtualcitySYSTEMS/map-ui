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
    onMounted,
    onUnmounted,
    provide,
  } from '@vue/composition-api';
  import VcsApp from '@/vcsApp.js';
  import WindowManagerComponent from '@/modules/window-manager/WindowManager.vue';
  import Popover from '@/modules/popover-manager/PopoverManager.vue';
  import ToolboxManagerComponent from '@/modules/toolbox-manager/ToolboxManager.vue';
  import Context from '@/context.js';
  import { ButtonLocation } from '@/modules/component-manager/buttonManager.js';
  import { vcsAppSymbol } from '@/vcsAppContextHelpers.js';
  import VcsMap from './VcsMap.vue';
  import Navbar from './Navbar.vue';
  import { createMapButtonAction } from '../actionHelper.js';


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
        default: './map.config.json',
      },
    },
    setup(props) {
      const id = uuid();
      const app = new VcsApp();
      provide('vcsApp', app);

      const iconMap = {
        'vcs.vcm.maps.Openlayers': '$vcs2d',
        'vcs.vcm.maps.Cesium': '$vcs3d',
        'vcs.vcm.maps.Oblique': '$vcsObliqueView',
      };

      const mapButtonActionDestroy = [];
      const mapAddedDestroy = app.maps.added.addEventListener(
        ({ className, name }) => {
          const { action, destroy } = createMapButtonAction(
            {
              name,
              icon: iconMap[className],
              title: `Activate ${ name}`,
            },
            name,
            app.maps,
          );
          app.navbarManager.add({
            location: ButtonLocation.MAP,
            action,
          }, vcsAppSymbol);
          mapButtonActionDestroy.push(destroy);
        },
      );

      let pluginAdded;
      const pluginRemoved = app.plugins.removed.addEventListener(async (plugin) => {
        app.windowManager.removeOwner(plugin.name);
        app.navbarManager.removeOwner(plugin.name);
      });

      onBeforeMount(async () => {
        const config = await fetch(props.config)
          .then(response => response.json());
        const context = new Context(config);
        await app.addContext(context);
      });

      onMounted(() => {
        pluginAdded = app.plugins.added.addEventListener((plugin) => {
          app.windowManager.removeOwner(plugin.name);
          app.navbarManager.removeOwner(plugin.name);
          if (plugin.onVcsAppMounted) {
            plugin.onVcsAppMounted(app);
          }
        });
        [...app.plugins].forEach((plugin) => {
          if (plugin.onVcsAppMounted) {
            plugin.onVcsAppMounted(app);
          }
        });
      });

      onUnmounted(() => {
        if (mapAddedDestroy) {
          mapAddedDestroy();
        }
        if (pluginAdded) {
          pluginAdded();
        }
        if (pluginRemoved) {
          pluginRemoved();
        }
        mapButtonActionDestroy.forEach(cb => cb());
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
