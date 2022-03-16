<template>
  <v-app class="h-full" absolute>
    <Navbar />
    <v-main fill-height absolute>
      <VcsMap :map-id="mapId" />
      <MapNavigation />
      <ToolboxManagerComponent v-if="toolboxManagerVisible" />
      <WindowManagerComponent />
    </v-main>
    <v-footer app absolute>
      footer
    </v-footer>
  </v-app>
</template>


<style scoped lang="scss">
::v-deep .v-application--wrap {
  min-height: fit-content;
}
</style>

<script>
  import Vue from 'vue';
  import { v4 as uuid } from 'uuid';
  import {
    onMounted,
    onUnmounted,
    provide,
  } from '@vue/composition-api';
  import { getVcsAppById } from '@vcmap/core';
  import WindowManagerComponent from '../manager/window/WindowManager.vue';
  import ToolboxManagerComponent from '../manager/toolbox/ToolboxManager.vue';
  import { ButtonLocation } from '../manager/buttonManager.js';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import VcsMap from './VcsMap.vue';
  import Navbar from './Navbar.vue';
  import { createMapButtonAction } from '../actions/actionHelper.js';
  import MapNavigation from '../navigation/mapNavigation.vue';

  export default Vue.extend({
    components: {
      MapNavigation,
      Navbar,
      VcsMap,
      WindowManagerComponent,
      ToolboxManagerComponent,
    },
    props: {
      appId: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const id = uuid();
      const app = getVcsAppById(props.appId);
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
