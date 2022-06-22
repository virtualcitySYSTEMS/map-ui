<template>
  <v-container class="fill-height pa-0" absolute fluid>
    <Navbar />
    <v-container class="vcs-main pa-0" :class="{ 'vcs-main-xs': $vuetify.breakpoint.xs }" fluid absolute>
      <div v-if="$vuetify.breakpoint.smAndDown" class="company-logo-mobile" />
      <VcsMap :map-id="mapId" />
      <MapNavigation />
      <ToolboxManagerComponent />
      <WindowManagerComponent />
    </v-container>
    <v-footer absolute v-if="!$vuetify.breakpoint.xs">
      footer
    </v-footer>
  </v-container>
</template>

<style scoped lang="scss">
::v-deep .v-application--wrap {
  min-height: fit-content;
}
.vcs-main {
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  bottom: 33px;
}

.vcs-main-xs {
  top: 0;
  bottom: 56px;
}

</style>

<script>
  import { v4 as uuid } from 'uuid';
  import {
    onMounted,
    onUnmounted,
    provide,
  } from '@vue/composition-api';
  import { getVcsAppById } from '@vcmap/core';
  import WindowManagerComponent from '../manager/window/WindowManager.vue';
  import ToolboxManagerComponent from '../manager/toolbox/ToolboxManager.vue';
  import { ButtonLocation } from '../manager/navbarManager.js';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import VcsMap from './VcsMap.vue';
  import Navbar from './Navbar.vue';
  import { createMapButtonAction } from '../actions/actionHelper.js';
  import MapNavigation from '../navigation/mapNavigation.vue';

  export default {
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
      app: {
        type: Boolean,
        default: true,
      },
    },
    setup(props) {
      const id = uuid();
      const mapId = `mapCollection-${id}`;
      const app = getVcsAppById(props.appId);
      provide('vcsApp', app);

      const iconMap = {
        OpenlayersMap: '$vcs2d',
        CesiumMap: '$vcs3d',
        ObliqueMap: '$vcsObliqueView',
      };

      const mapButtonActionDestroy = {};

      const setupMap = ({ className, name }) => {
        if (mapButtonActionDestroy[name]) {
          mapButtonActionDestroy[name]();
        }
        const { action, destroy } = createMapButtonAction(
          {
            name,
            icon: iconMap[className],
            title: `Activate ${ name}`,
          },
          name,
          app.maps,
        );
        app.navbarManager.add(
          {
            id: `mapButton-${name}`,
            action,
          },
          vcsAppSymbol,
          ButtonLocation.MAP,
        );
        mapButtonActionDestroy[name] = () => {
          app.navbarManager.remove(`mapButton-${name}`);
          destroy();
        };
      };

      [...app.maps].forEach(setupMap);
      const mapAddedDestroy = app.maps.added.addEventListener(setupMap);

      const mapRemovedDestroy = app.maps.removed.addEventListener(({ name }) => {
        if (mapButtonActionDestroy[name]) {
          mapButtonActionDestroy[name]();
          delete mapButtonActionDestroy[name];
        }
      });

      let pluginAdded;
      const pluginRemoved = app.plugins.removed.addEventListener(async (plugin) => {
        app.windowManager.removeOwner(plugin.name);
        app.navbarManager.removeOwner(plugin.name);
        app.toolboxManager.removeOwner(plugin.name);
      });

      onMounted(() => {
        pluginAdded = app.plugins.added.addEventListener((plugin) => {
          app.windowManager.removeOwner(plugin.name);
          app.navbarManager.removeOwner(plugin.name);
          app.toolboxManager.removeOwner(plugin.name);
          if (plugin.onVcsAppMounted) {
            plugin.onVcsAppMounted(app);
          }
        });
        [...app.plugins].forEach((plugin) => {
          if (plugin.onVcsAppMounted) {
            plugin.onVcsAppMounted(app);
          }
        });
        app.maps.setTarget(mapId);
      });

      onUnmounted(() => {
        if (mapAddedDestroy) {
          mapAddedDestroy();
        }
        if (mapRemovedDestroy) {
          mapRemovedDestroy();
        }
        if (pluginAdded) {
          pluginAdded();
        }
        if (pluginRemoved) {
          pluginRemoved();
        }
        Object.values(mapButtonActionDestroy).forEach(cb => cb());
      });

      return {
        mapId,
      };
    },
    provide() {
      return {
        language: window.navigator.language.split('-')[0],
      };
    },
  };
</script>
