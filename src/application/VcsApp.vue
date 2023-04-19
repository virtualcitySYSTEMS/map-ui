<template>
  <v-container class="fill-height pa-0" absolute fluid>
    <VcsNavbar />
    <v-container
      class="vcs-main pa-0"
      :class="{ 'vcs-main-xs': $vuetify.breakpoint.xs }"
      fluid
      absolute
    >
      <template v-if="$vuetify.breakpoint.xs">
        <img
          v-if="mobileLogo"
          :src="mobileLogo"
          alt="Logo"
          draggable="false"
          class="mobile-logo"
        />
        <div v-else class="company-logo-mobile mobile-logo" />
      </template>
      <VcsButton
        v-if="!$vuetify.breakpoint.smAndUp && $vuetify.breakpoint.mobile"
        :key="attributionAction.name"
        :tooltip="attributionAction.title"
        :icon="attributionAction.icon"
        :active="attributionAction.active"
        @click.stop="attributionAction.callback($event)"
        small
        class="z-index-1 mobile-attribution-btn"
      />
      <VcsMap :map-id="mapId" />
      <MapNavigation />
      <ToolboxManagerComponent />
      <WindowManagerComponent />
      <NotifierComponent />
    </v-container>
    <v-footer absolute v-if="$vuetify.breakpoint.smAndUp" min-height="22px">
      <VcsAttributionsFooter
        :entries="attributionEntries"
        :attribution-action="attributionAction"
      />
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
    bottom: 22px;
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

  .mobile-attribution-btn {
    position: fixed;
    right: 2px;
    bottom: 56px;
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
  } from 'vue';
  import { getVcsAppById } from '@vcmap/core';
  import { VContainer, VFooter } from 'vuetify/lib';
  import { getLogger } from '@vcsuite/logger';
  import WindowManagerComponent from '../manager/window/WindowManager.vue';
  import ToolboxManagerComponent from '../manager/toolbox/ToolboxManager.vue';
  import { ButtonLocation } from '../manager/navbarManager.js';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import VcsMap from './VcsMap.vue';
  import VcsNavbar from './VcsNavbar.vue';
  import {
    createMapButtonAction,
    createToggleAction,
  } from '../actions/actionHelper.js';
  import MapNavigation from '../navigation/mapNavigation.vue';
  import VcsSettings from './VcsSettings.vue';
  import { WindowSlot } from '../manager/window/windowManager.js';
  import CategoryManager from '../manager/categoryManager/CategoryManager.vue';
  import { defaultPrimaryColor } from '../vuePlugins/vuetify.js';
  import VcsLegend from '../legend/vcsLegend.vue';
  import { getLegendEntries } from '../legend/legendHelper.js';
  import VcsAttributionsFooter from './VcsAttributionsFooter.vue';
  import VcsButton from '../components/buttons/VcsButton.vue';
  import VcsAttributions from './VcsAttributions.vue';
  import { getAttributions } from './attributionsHelper.js';
  import NotifierComponent from '../notifier/notifierComponent.vue';

  /**
   * You should call this function in the component providing the vcsUiApp to your
   * application in the components mounted hook. This will call VcsAppMounted on all plugins in the app
   * and add a listener to call. Returns a destroy hook to stop listening to the added event. If you use the VcsApp
   * component, do not call this function, since the component will do this for you.
   * @param {VcsUiApp} app
   * @returns {function():void}
   */
  export function setupPluginMountedListeners(app) {
    /**
     * wrapped execution of onVcsAppMounted hook
     * @param {VcsPlugin} plugin
     */
    function onVcsAppMounted(plugin) {
      if (plugin.onVcsAppMounted) {
        try {
          plugin.onVcsAppMounted(app);
        } catch (e) {
          getLogger('VcsUiApp').error(
            `Error in plugin ${plugin.name} onVcsAppMounted hook`,
            e,
          );
        }
      }
    }

    [...app.plugins].forEach(onVcsAppMounted);

    return app.plugins.added.addEventListener(onVcsAppMounted);
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
      Object.values(mapButtonActionDestroy).forEach((cb) => cb());
    };
  }

  /**
   * This helper function will add a legend action button to the apps NavbarManager TOOL location, if legend entries are available.
   * Watches number of legend entries.
   * @param {VcsUiApp} app
   * @returns {function():void}
   */
  export function setupLegendWindow(app) {
    const { entries, destroy } = getLegendEntries(app);

    const { action: legendAction, destroy: legendDestroy } = createToggleAction(
      {
        name: 'legendToggle',
        icon: '$vcsLegend',
        title: 'legend.tooltip',
      },
      {
        id: 'legend',
        component: VcsLegend,
        state: {
          headerTitle: 'legend.title',
          headerIcon: '$vcsLegend',
        },
        slot: WindowSlot.DYNAMIC_RIGHT,
        props: { entries },
      },
      app.windowManager,
      vcsAppSymbol,
    );

    /**
     * Adds a legend button, if not existing
     */
    const addLegend = () => {
      if (!app.navbarManager.has('legend')) {
        app.navbarManager.add(
          {
            id: 'legend',
            action: legendAction,
          },
          vcsAppSymbol,
          ButtonLocation.TOOL,
        );
      }
    };

    /**
     * Handles legend button and window.
     * Adds a button, if legend definitions are available or removes legend otherwise.
     */
    const handleLegend = () => {
      const layersWithLegend = [...app.layers].filter(
        (layer) => layer.style?.properties?.legend ?? layer.properties?.legend,
      );
      const stylesWithLegend = [...app.styles].filter(
        (style) => style?.properties?.legend,
      );
      if (layersWithLegend < 1 && stylesWithLegend < 1) {
        app.navbarManager.remove('legend');
        app.windowManager.remove('legend');
      }
    };

    const listeners = [
      app.layers.added.addEventListener((layer) => {
        if (layer.style?.properties?.legend ?? layer.properties?.legend) {
          addLegend();
        }
      }),
      app.styles.added.addEventListener((style) => {
        if (style?.properties?.legend) {
          addLegend();
        }
      }),
      app.layers.removed.addEventListener(handleLegend),
      app.styles.removed.addEventListener(handleLegend),
    ];

    return () => {
      destroy();
      legendDestroy();
      listeners.forEach((cb) => cb());
    };
  }

  /**
   * This helper function will add a settings action button to the apps NavbarManager MENU location.
   * @param {VcsUiApp} app
   * @returns {function():void}
   */
  export function setupSettingsWindow(app) {
    const { action: settingsAction, destroy: settingsDestroy } =
      createToggleAction(
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
    return () => {
      settingsDestroy();
    };
  }

  /**
   * This helper function will add a category manager button to the navbar. The category Manager
   * will only be shown if there is at least one category under management in the categoryManager.
   * @param {VcsUiApp} app
   * @returns {function():void}
   */
  export function setupCategoryManagerWindow(app) {
    const id = 'category-manager';
    const { action: categoryManagerAction, destroy } = createToggleAction(
      {
        name: id,
        icon: '$vcsComponents',
        title: 'categoryManager.tooltip',
      },
      {
        id,
        state: {
          headerTitle: 'categoryManager.title',
          headerIcon: '$vcsComponents',
        },
        component: CategoryManager,
        slot: WindowSlot.STATIC,
      },
      app.windowManager,
      vcsAppSymbol,
    );

    const setupCategories = () => {
      if (app.categoryManager.componentIds.length > 0) {
        if (!app.navbarManager.has(id)) {
          app.navbarManager.add(
            { id, action: categoryManagerAction },
            vcsAppSymbol,
            ButtonLocation.CONTENT,
          );
        }
      } else {
        app.windowManager.remove(id);
        app.navbarManager.remove(id);
      }
    };
    const addedListener =
      app.categoryManager.added.addEventListener(setupCategories);
    const removedListener =
      app.categoryManager.removed.addEventListener(setupCategories);
    setupCategories();

    return () => {
      destroy();
      addedListener();
      removedListener();
    };
  }

  /**
   * This helper sets up a listener to sync the theming relevant keys from the {@see UiConfigObject}
   * with a given vuetify instance. Use this helper, if you do not use the VcsApp component and wish to evaluate
   * the theming keys. Returns a function to stop syncing.
   * Also adds a watcher to vuetify theme, which triggers themeChanged event on the VcsUiApp.
   * @param {VcsUiApp} app
   * @param {import("vuetify").Framework} vuetify
   * @returns {function():void} - call to stop syncing
   */
  export function setupUiConfigTheming(app, vuetify) {
    const listeners = [
      app.uiConfig.added.addEventListener((item) => {
        if (item.name === 'primaryColor') {
          vuetify.theme.themes.dark.primary = item.value?.dark || item.value;
          vuetify.theme.themes.light.primary = item.value?.light || item.value;
          app.themeChanged.raiseEvent();
        }
      }),
      app.uiConfig.removed.addEventListener((item) => {
        if (item.name === 'primaryColor') {
          vuetify.theme.themes.dark.primary = defaultPrimaryColor.dark;
          vuetify.theme.themes.light.primary = defaultPrimaryColor.light;
          app.themeChanged.raiseEvent();
        }
      }),
    ];
    const stopWatching = watch(
      () => vuetify.theme.dark,
      () => app.themeChanged.raiseEvent(),
    );

    return () => {
      listeners.forEach((cb) => {
        cb();
      });
      listeners.splice(0);
      stopWatching();
    };
  }

  /**
   * This helper gets attributions of all active maps, layers and oblique collections and returns an array of entries.
   * It also returns a attributionAction to toggle the attributions window and a destroy function.
   * @param {VcsUiApp} app
   * @returns {{attributionEntries: import("vue").Ref<Array<AttributionEntry>>, attributionAction: VcsAction, destroyAttributions: function():void}}
   */
  export function setupAttributions(app) {
    const { entries, destroy } = getAttributions(app);

    const { action: attributionAction, destroy: attributionDestroy } =
      createToggleAction(
        {
          name: 'attributionToggle',
          icon: 'mdi-chevron-double-right',
          title: 'footer.attributions.tooltip',
        },
        {
          id: 'attribution',
          component: VcsAttributions,
          state: {
            headerTitle: 'footer.attributions.title',
            headerIcon: 'mdi-copyright',
          },
          slot: WindowSlot.DYNAMIC_RIGHT,
          props: { entries },
        },
        app.windowManager,
        vcsAppSymbol,
      );

    return {
      attributionEntries: entries,
      attributionAction,
      destroyAttributions: () => {
        destroy();
        attributionDestroy();
      },
    };
  }

  /**
   * The base component to setup the entire application. To embed the VcsApp, use this component.
   * @vue-prop {string} appId - the id of the app to inject. this will setup listeners on the app to call vcsAppMounted on plugins
   * @vue-provide
   */
  export default {
    components: {
      VcsButton,
      VcsAttributionsFooter,
      MapNavigation,
      VcsNavbar,
      VcsMap,
      WindowManagerComponent,
      ToolboxManagerComponent,
      VContainer,
      VFooter,
      NotifierComponent,
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
      const legendDestroy = setupLegendWindow(app);
      const settingsDestroy = setupSettingsWindow(app);
      const destroyComponentsWindow = setupCategoryManagerWindow(app);
      const destroyThemingListener = setupUiConfigTheming(
        app,
        getCurrentInstance().proxy.$vuetify,
      );
      const { attributionEntries, attributionAction, destroyAttributions } =
        setupAttributions(app);

      let pluginMountedListener;
      onMounted(() => {
        pluginMountedListener = setupPluginMountedListeners(app);
        app.maps.setTarget(mapId);
        app.mounted.raiseEvent(mapId);
      });

      onUnmounted(() => {
        if (pluginMountedListener) {
          pluginMountedListener();
        }
        mapNavbarListener();
        legendDestroy();
        settingsDestroy();
        destroyComponentsWindow();
        destroyThemingListener();
        destroyAttributions();
      });

      return {
        mapId,
        mobileLogo: computed(
          () =>
            app.uiConfig.config.value.mobileLogo ??
            app.uiConfig.config.value.logo,
        ),
        attributionEntries,
        attributionAction,
      };
    },
  };
</script>
