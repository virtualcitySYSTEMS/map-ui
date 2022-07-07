<template>
  <v-container class="fill-height pa-0" absolute fluid>
    <Navbar />
    <v-container class="vcs-main pa-0" :class="{ 'vcs-main-xs': $vuetify.breakpoint.xs }" fluid absolute>
      <template v-if="$vuetify.breakpoint.smAndDown">
        <img v-if="mobileLogo" :src="mobileLogo" alt="Logo" class="mobile-logo">
        <div v-else class="company-logo-mobile mobile-logo" />
      </template>
      <VcsMap :map-id="mapId" />
      <MapNavigation />
      <ToolboxManagerComponent />
      <WindowManagerComponent />
    </v-container>
    <v-footer absolute v-if="!$vuetify.breakpoint.xs">
      {{ $t('footer.title') }}
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

.mobile-logo {
  max-height: 40px;
  max-width: 70px;
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 1;
}

</style>

<script>
  import { v4 as uuid } from 'uuid';
  import {
    computed,
    getCurrentInstance,
    onMounted,
    onUnmounted,
    provide,
    watch,
  } from '@vue/composition-api';
  import { getVcsAppById } from '@vcmap/core';
  import WindowManagerComponent from '../manager/window/WindowManager.vue';
  import ToolboxManagerComponent from '../manager/toolbox/ToolboxManager.vue';
  import { ButtonLocation } from '../manager/navbarManager.js';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import VcsMap from './VcsMap.vue';
  import Navbar from './Navbar.vue';
  import { createMapButtonAction, createToggleAction } from '../actions/actionHelper.js';
  import MapNavigation from '../navigation/mapNavigation.vue';
  import VcsSettings from './VcsSettings.vue';
  import { WindowSlot } from '../manager/window/windowManager.js';
  import ComponentsManager from '../manager/categoryManager/ComponentsManager.vue';
  import { defaultPrimaryColor } from '../vuePlugins/vuetify.js';

  /**
   * You should call this function in the component providing the vcsUiApp to your
   * application in the components mounted hook. This will call VcsAppMounted on all plugins in the app
   * and add a listener to call. Returns a destroy hook to stop listening to the added event. If you use the VcsApp
   * component, do not call this function, since the component will do this for you.
   * @param {VcsUiApp} app
   * @returns {function():void}
   */
  export function setupPluginMountedListeners(app) {
    [...app.plugins].forEach((plugin) => {
      if (plugin.onVcsAppMounted) {
        plugin.onVcsAppMounted(app);
      }
    });

    return app.plugins.added.addEventListener((plugin) => {
      if (plugin.onVcsAppMounted) {
        plugin.onVcsAppMounted(app);
      }
    });
  }

  /**
   * This helper function will add a map action button based on the default icons
   * to the apps NavbarManager. Furthermore, all maps on the app are synced for adding and removing.
   * @param {VcsUiApp} app
   * @returns {function():void}
   */
  export function setupMapNavbar(app) {
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
          title: `navbar.maps.${className}`,
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
    const mapAddedListener = app.maps.added.addEventListener(setupMap);

    const mapRemovedListener = app.maps.removed.addEventListener(({ name }) => {
      if (mapButtonActionDestroy[name]) {
        mapButtonActionDestroy[name]();
        delete mapButtonActionDestroy[name];
      }
    });

    return () => {
      mapAddedListener();
      mapRemovedListener();
      Object.values(mapButtonActionDestroy).forEach(cb => cb());
    };
  }

  /**
   * This helper function will add a Components manager button to the navbar. The Components Manager
   * will only be shown if there is at least one category under management in the categoryManager.
   * @param {VcsUiApp} app
   * @returns {function():void}
   */
  export function setupComponentsWindow(app) {
    const { action: componentsManagerAction, destroy: destroyComponentsManagerAction } = createToggleAction(
      {
        name: 'components-manager',
        icon: '$vcsComponents',
        title: 'components.tooltip',
      },
      {
        id: 'component-manager',
        state: {
          headerTitle: 'components.title',
          headerIcon: '$vcsComponents',
        },
        component: ComponentsManager,
        slot: WindowSlot.STATIC,
      },
      app.windowManager,
      vcsAppSymbol,
    );

    // only show Components Window if we have at least one managed Category
    if (app.categoryManager.items.value.length > 0) {
      app.navbarManager.add(
        { id: 'component-manager', action: componentsManagerAction },
        vcsAppSymbol,
        ButtonLocation.CONTENT,
      );
    }
    watch(app.categoryManager.items, () => {
      if (app.categoryManager.items.value.length > 0) {
        if (!app.navbarManager.has('component-manager')) {
          app.navbarManager.add(
            { id: 'component-manager', action: componentsManagerAction },
            vcsAppSymbol,
            ButtonLocation.CONTENT,
          );
        }
      } else {
        app.windowManager.remove('component-manager');
        app.navbarManager.remove('component-manager');
      }
    });

    return () => {
      destroyComponentsManagerAction();
    };
  }

  /**
   * This helper sets up a listener to sync the theming relevant keys from the {@see UiConfigObject}
   * with a given vuetify instance. Use this helper, if you do not use the VcsApp component and wish to evaluate
   * the theming keys. Returns a function to stop syncing.
   * @param {VcsUiApp} app
   * @param {import("vuetify").Framework} vuetify
   * @returns {function():void} - call to stop syncing
   */
  export function setupUiConfigTheming(app, vuetify) {
    const listeners = [
      app.uiConfig.added.addEventListener((item) => {
        if (item.name === 'primaryColor') {
          vuetify.theme.themes.dark.primary = item.value;
          vuetify.theme.themes.light.primary = item.value;
        }
      }),
      app.uiConfig.removed.addEventListener((item) => {
        if (item.name === 'primaryColor') {
          vuetify.theme.themes.dark.primary = defaultPrimaryColor;
          vuetify.theme.themes.light.primary = defaultPrimaryColor;
        }
      }),
    ];

    return () => {
      listeners.forEach((cb) => { cb(); });
      listeners.splice(0);
    };
  }

  /**
   * The base component to setup the entire application. To embed the VcsApp, use this component.
   * @vue-prop {string} appId - the id of the app to inject. this will setup listeners on the app to call vcsAppMounted on plugins
   * @vue-provide
   */
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
    },
    setup(props) {
      const id = uuid();
      const mapId = `mapCollection-${id}`;
      /** @type {VcsUiApp} */
      const app = getVcsAppById(props.appId);
      provide('vcsApp', app);

      const mapNavbarListener = setupMapNavbar(app);
      const { action: settingsAction, destroy: settingsDestroy } = createToggleAction(
        {
          name: 'settings.title',
          icon: 'mdi-cog',
          title: 'settings.tooltip',
        },
        {
          id: 'settingsId',
          component: VcsSettings,
          state: { headerIcon: 'mdi-cog', headerTitle: 'settings.title' },
          slot: WindowSlot.DYNAMIC_RIGHT,
        },
        app.windowManager,
        vcsAppSymbol,
      );
      app.navbarManager.add(
        {
          id: 'settingsToggle',
          action: settingsAction,
        },
        vcsAppSymbol,
        ButtonLocation.MENU,
      );

      const destroyComponentsWindow = setupComponentsWindow(app);
      const destroyThemingListener = setupUiConfigTheming(app, getCurrentInstance().proxy.$vuetify);

      let pluginMountedListener;
      onMounted(() => {
        pluginMountedListener = setupPluginMountedListeners(app);
        app.maps.setTarget(mapId);
      });

      onUnmounted(() => {
        if (pluginMountedListener) {
          pluginMountedListener();
        }
        mapNavbarListener();
        settingsDestroy();
        destroyComponentsWindow();
        destroyThemingListener();
      });

      return {
        mapId,
        mobileLogo: computed(() => app.uiConfig.config.value.mobileLogo ?? app.uiConfig.config.value.logo),
      };
    },
  };
</script>
