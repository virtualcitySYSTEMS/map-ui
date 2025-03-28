<template>
  <v-container class="fill-height pa-0 vcs-app" absolute fluid>
    <VcsSplashScreen
      v-if="splashScreen"
      :options="splashScreen"
      v-model="showSplashScreen"
    ></VcsSplashScreen>
    <VcsNavbar v-if="!config.hideHeader && smAndUp && !mobileLandscape" />
    <VcsNavbarMobile v-if="!config.hideHeader && xs && !mobileLandscape" />
    <VcsContainer :attribution-action="attributionAction" />
    <v-footer
      v-if="showFooter && !mobileLandscape"
      app
      absolute
      :height="footerHeight"
      class="d-flex gc-1 pa-0"
    >
      <VcsPositionDisplay />
      <VcsObliqueFooter />
      <VcsTextPageFooter
        v-if="imprint"
        :text-page="imprint"
        :window-id="'imprintWindow'"
      />
      <VcsTextPageFooter
        v-if="dataProtection"
        :text-page="dataProtection"
        :window-id="'dataProtectionWindow'"
      />
      <v-spacer />
      <VcsAttributionsFooter
        :entries="attributionEntries"
        :attribution-action="attributionAction"
      />
    </v-footer>
    <p v-if="mobileLandscape" class="mobileRotatedWarning">
      {{ $st('footer.mobile.rotationWarning') }}
    </p>
  </v-container>
</template>

<script>
  import {
    computed,
    onMounted,
    onUnmounted,
    provide,
    watch,
    shallowRef,
  } from 'vue';
  import { useDisplay } from 'vuetify';
  import { getVcsAppById, moduleIdSymbol } from '@vcmap/core';
  import { VContainer, VFooter, VSpacer } from 'vuetify/components';
  import { getLogger } from '@vcsuite/logger';
  import VcsContainer from './VcsContainer.vue';
  import { ButtonLocation } from '../manager/navbarManager.js';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import VcsNavbar from './VcsNavbar.vue';
  import VcsNavbarMobile from './VcsNavbarMobile.vue';
  import {
    createLinkAction,
    createMapButtonAction,
    createToggleAction,
  } from '../actions/actionHelper.js';
  import { setupDeepPicking } from '../actions/deepPickingAction.js';
  import VcsSettings from './VcsSettings.vue';
  import { WindowSlot } from '../manager/window/windowManager.js';
  import CollectionManager from '../manager/collectionManager/CollectionManager.vue';
  import {
    createVcsThemes,
    setTheme,
    useFontSize,
    isMobileLandscape,
  } from '../vuePlugins/vuetify.js';
  import VcsLegend from '../legend/VcsLegend.vue';
  import {
    getLayerLegend,
    getLegendEntries,
    getStyleLegend,
  } from '../legend/legendHelper.js';
  import VcsAttributionsFooter from './VcsAttributionsFooter.vue';
  import VcsObliqueFooter from './VcsObliqueFooter.vue';
  import VcsTextPageFooter from './VcsTextPageFooter.vue';
  import VcsSplashScreen, {
    shouldShowSplashSceen,
  } from './VcsSplashScreen.vue';
  import VcsTextPage from './VcsTextPage.vue';
  import VcsAttributions from './VcsAttributions.vue';
  import { getAttributions } from './attributionsHelper.js';
  import VcsDefaultLogoMobile from '../logo-mobile.svg';
  import VcsPositionDisplay from './VcsPositionDisplay.vue';

  /**
   * This helper checks the uiConfig and depending on the value will setup/teardown the providedSetupFunction
   * @param {import("../vcsUiApp.js").default} app
   * @param {(import("../vcsUiApp.js").default) => () => void} setupFunction
   * @param {string} configOption parameter name of a uiConfig parameter, for example `app.uiConfig.config.hideContentTree`
   * @returns {function():void} - cleanup function
   */
  export function setupUIConfigDependency(app, setupFunction, configOption) {
    let destroyFunction = null;
    function handler() {
      if (!app.uiConfig.config[configOption] && !destroyFunction) {
        destroyFunction = setupFunction(app);
      } else if (app.uiConfig.config[configOption] && destroyFunction) {
        destroyFunction();
        destroyFunction = null;
      }
    }
    handler();
    const listeners = [
      app.uiConfig.added.addEventListener(handler),
      app.uiConfig.added.addEventListener(handler),
    ];

    return () => {
      if (destroyFunction) {
        destroyFunction();
      }
      listeners.forEach((cb) => cb());
    };
  }

  /**
   * You should call this function in the component providing the vcsUiApp to your
   * application in the components mounted hook. This will call VcsAppMounted on all plugins in the app
   * and add a listener to call. Returns a destroy hook to stop listening to the added event. If you use the VcsApp
   * component, do not call this function, since the component will do this for you.
   * @param {import("../vcsUiApp.js").default} app
   * @returns {function():void}
   */
  export function setupPluginMountedListeners(app) {
    /**
     * wrapped execution of onVcsAppMounted hook
     * @param {import("@src/vcsUiApp.js").VcsPlugin} plugin
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
   * The buttons can be removed with the uiConfig hideMapButtons
   * @param {import("../vcsUiApp.js").default} app
   * @returns {function():void}
   */
  export function setupMapNavbar(app) {
    const iconMap = {
      OpenlayersMap: '$vcs2d',
      CesiumMap: '$vcs3d',
      ObliqueMap: '$vcsObliqueView',
    };
    const mapBtnWeight = {
      OpenlayersMap: 3,
      CesiumMap: 2,
      ObliqueMap: 1,
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
          weight: mapBtnWeight[className],
        },
        vcsAppSymbol,
        ButtonLocation.MAP,
        { mobile: true, tablet: true, desktop: true },
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

  export const legendComponentId = 'legendId';

  /**
   * This helper function will add a legend action button to the apps NavbarManager TOOL location, if legend entries are available.
   * Watches number of legend entries.
   * @param {import("../vcsUiApp.js").default} app
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
        id: legendComponentId,
        component: VcsLegend,
        state: {
          headerTitle: 'legend.title',
          headerIcon: '$vcsLegend',
          infoUrl: app.getHelpUrlCallback(
            '/components/contentspace.html#id_legend',
          ),
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
      if (!app.navbarManager.has(legendComponentId)) {
        app.navbarManager.add(
          {
            id: legendComponentId,
            action: legendAction,
          },
          vcsAppSymbol,
          ButtonLocation.CONTENT,
          { mobile: true, tablet: true, desktop: true },
        );
      }
    };

    /**
     * Handles legend button and window.
     * Adds a button, if legend definitions are available or removes legend otherwise.
     */
    const handleLegend = () => {
      const layersWithLegend = [...app.layers].filter((layer) =>
        getLayerLegend(layer),
      );
      const stylesWithLegend = [...app.styles].filter((style) =>
        getStyleLegend(style),
      );
      if (layersWithLegend < 1 && stylesWithLegend < 1) {
        app.navbarManager.remove(legendComponentId);
        app.windowManager.remove(legendComponentId);
      } else {
        addLegend();
      }
    };

    const { xs } = useDisplay();
    let currentEntryLength = entries.length;
    const watchEntries = watch(entries, (newValue) => {
      if (newValue.length > currentEntryLength) {
        handleLegend();
      }
      if (
        app.uiConfig.config.openLegendOnAdd &&
        newValue.length > currentEntryLength &&
        !app.windowManager.has(legendComponentId) &&
        !xs.value
      ) {
        app.windowManager.add(
          {
            id: legendComponentId,
            component: VcsLegend,
            state: {
              headerTitle: 'legend.title',
              headerIcon: '$vcsLegend',
              infoUrl: app.getHelpUrlCallback(
                '/components/contentspace.html#id_legend',
              ),
            },
            slot: WindowSlot.DYNAMIC_RIGHT,
            props: { entries },
          },
          vcsAppSymbol,
        );
      }
      currentEntryLength = newValue.length;
    });

    handleLegend();

    const listeners = [
      app.layers.added.addEventListener((layer) => {
        if (getLayerLegend(layer)) {
          addLegend();
        }
      }),
      app.styles.added.addEventListener((style) => {
        if (getStyleLegend(style)) {
          addLegend();
        }
      }),
      app.layers.removed.addEventListener(handleLegend),
      app.styles.removed.addEventListener(handleLegend),
    ];

    return () => {
      watchEntries();
      app.navbarManager.remove(legendComponentId);
      app.windowManager.remove(legendComponentId);
      destroy();
      legendDestroy();
      listeners.forEach((cb) => cb());
    };
  }

  export const customScreenComponentId = 'customScreenId';

  /**
   * This helper function will add a customScreen action button to the apps NavbarManager MENU location.
   * @param {import("../vcsUiApp.js").default} app
   * @returns {function():void}
   */
  function setupCustomScreen(app) {
    function setupCustomScreenAction() {
      const { customScreen } = app.uiConfig.config;
      const { action: customScreenAction, destroy: customScreenDestroy } =
        createToggleAction(
          {
            name: customScreen.name || 'components.customScreen.name',
            icon: customScreen.icon || 'mdi-information',
            title: customScreen.title,
          },
          {
            id: customScreenComponentId,
            component: VcsTextPage,
            state: {
              headerIcon: customScreen.icon,
              headerTitle: customScreen.name,
            },
            slot: WindowSlot.DETACHED,
            position: customScreen.windowPosition,
            props: {
              content: customScreen.content,
            },
          },
          app.windowManager,
          vcsAppSymbol,
        );
      app.navbarManager.add(
        {
          id: customScreenComponentId,
          action: customScreenAction,
        },
        vcsAppSymbol,
        ButtonLocation.MENU,
        { mobile: true, tablet: true, desktop: true },
      );
      return () => {
        customScreenDestroy();
      };
    }
    let customScreen;
    const stopCustomScreenWatcher = watch(
      () => app.uiConfig.config.customScreen,
      (newCustomScreen) => {
        if (app.navbarManager.has(customScreenComponentId)) {
          app.navbarManager.remove(customScreenComponentId);
        }
        if (newCustomScreen) {
          customScreen = setupCustomScreenAction();
        }
      },
      { immediate: true },
    );
    return () => {
      if (customScreen) {
        customScreen();
      }
      stopCustomScreenWatcher();
    };
  }

  export const splashScreenComponentId = 'splashScreenToggle';
  /**
   * This helper function will add a Splash Screen action button to the apps NavbarManager MENU location.
   * @param {import("../vcsUiApp.js").default} app
   * @returns {WatchStopHandle}
   */
  function setupSplashScreen(app) {
    const { config, showSplashScreen } = app.uiConfig;
    function setupSplashScreenAction(moduleId) {
      const { splashScreen } = config;
      if (splashScreen && moduleId !== app.dynamicModuleId) {
        showSplashScreen.value = shouldShowSplashSceen(app);
      }
      if (splashScreen && splashScreen.menuEntry) {
        const splashScreenAction = {
          name: splashScreen.name || 'components.splashScreen.name',
          icon: splashScreen.icon || 'mdi-alert-box',
          title: splashScreen.title,
          callback() {
            showSplashScreen.value = !showSplashScreen.value;
          },
        };
        app.navbarManager.add(
          {
            id: splashScreenComponentId,
            action: splashScreenAction,
          },
          vcsAppSymbol,
          ButtonLocation.MENU,
          { mobile: true, tablet: true, desktop: true },
        );
      }
    }
    setupSplashScreenAction();
    const removeAddedListener = app.uiConfig.added.addEventListener((item) => {
      if (item.name === 'splashScreen') {
        if (app.navbarManager.has(splashScreenComponentId)) {
          app.navbarManager.remove(splashScreenComponentId);
        }
        setupSplashScreenAction(item[moduleIdSymbol]);
      }
    });
    const removeRemovedListener = app.uiConfig.removed.addEventListener(
      (item) => {
        if (item.name === 'splashScreen') {
          if (app.navbarManager.has(splashScreenComponentId)) {
            app.navbarManager.remove(splashScreenComponentId);
          }
        }
      },
    );
    return () => {
      removeAddedListener();
      removeRemovedListener();
    };
  }

  export const settingsComponentId = 'vcsSettings';
  /**
   * This helper function will add a settings action button to the apps NavbarManager MENU location.
   * @param {import("../vcsUiApp.js").default} app
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
          id: settingsComponentId,
          component: VcsSettings,
          state: { headerIcon: 'mdi-cog', headerTitle: 'settings.title' },
          slot: WindowSlot.DYNAMIC_RIGHT,
        },
        app.windowManager,
        vcsAppSymbol,
      );
    app.navbarManager.add(
      {
        id: settingsComponentId,
        action: settingsAction,
      },
      vcsAppSymbol,
      ButtonLocation.MENU,
      { mobile: true, tablet: true, desktop: true },
    );
    return () => {
      app.navbarManager.remove(settingsComponentId);
      app.windowManager.remove(settingsComponentId);
      settingsDestroy();
    };
  }

  export const helpComponentId = 'helpButton';
  /**
   * This helper function will add a help action button referencing VC Map help page to the apps NavbarManager MENU location.
   * @param {import("../vcsUiApp.js").default} app
   */
  export function setupHelpButton(app) {
    const helpAction = createLinkAction(
      {
        name: 'help.title',
        title: 'help.tooltip',
        icon: '$vcsHelp',
      },
      app.getHelpUrlCallback(),
    );
    app.navbarManager.add(
      {
        id: helpComponentId,
        action: helpAction,
      },
      vcsAppSymbol,
      ButtonLocation.MENU,
      { mobile: true, tablet: true, desktop: true },
    );
  }

  /**
   * @type {string}
   */
  export const categoryManagerWindowId = 'category-manager';

  /**
   * This helper function will add a category manager button to the navbar. The category Manager
   * will only be shown if there is at least one category under management in the categoryManager.
   * @param {import("../vcsUiApp.js").default} app
   * @returns {function():void}
   */
  export function setupCategoryManagerWindow(app) {
    const { action: categoryManagerAction, destroy } = createToggleAction(
      {
        name: categoryManagerWindowId,
        icon: '$vcsComponents',
        title: 'categoryManager.tooltip',
      },
      {
        id: categoryManagerWindowId,
        state: {
          headerTitle: 'categoryManager.title',
          headerIcon: '$vcsComponents',
          infoUrl: app.getHelpUrlCallback(
            '/components/contentspace.html#id_myWorkspace',
          ),
        },
        component: CollectionManager,
        provides: {
          collectionManager: app.categoryManager,
        },
        slot: WindowSlot.DYNAMIC_LEFT,
      },
      app.windowManager,
      vcsAppSymbol,
    );

    const collectionListeners = new Map();

    /**
     * Makes sure that the category-manager button is in the navbar.
     * Adds listener to the collectionComponents collection to display hasUpdate if new item is added to collection AND category-manager window is closed.
     * @param {import("../manager/collectionManager/collectionComponentClass.js").default} collectionComponent
     */
    function handleAdded(collectionComponent) {
      if (!app.navbarManager.has(categoryManagerWindowId)) {
        app.navbarManager.add(
          { id: categoryManagerWindowId, action: categoryManagerAction },
          vcsAppSymbol,
          ButtonLocation.CONTENT,
        );
      }
      collectionListeners.set(
        collectionComponent.id,
        collectionComponent.collection.added.addEventListener((item) => {
          if (
            !app.windowManager.has(categoryManagerWindowId) &&
            item[moduleIdSymbol] === app.dynamicModuleId
          ) {
            categoryManagerAction.hasUpdate = true;
          }
        }),
      );
    }

    /**
     * Removes listener on collection of collectionComponent.
     * Removes collection-manager button in navbar, if categoryManager has no more collectionComponents.
     * @param {import("../manager/collectionManager/collectionComponentClass.js").default} collectionComponent
     */
    function handleRemoved(collectionComponent) {
      collectionListeners.get(collectionComponent.id)?.();
      collectionListeners.delete(collectionComponent.id);

      if (!app.categoryManager.componentIds.length) {
        app.windowManager.remove(categoryManagerWindowId);
        app.navbarManager.remove(categoryManagerWindowId);
        categoryManagerAction.hasUpdate = false;
      }
    }

    const addedListener =
      app.categoryManager.added.addEventListener(handleAdded);
    const removedListener =
      app.categoryManager.removed.addEventListener(handleRemoved);

    // setup existing collectionComponents
    app.categoryManager.componentIds.forEach((componentId) =>
      handleAdded(app.categoryManager.get(componentId)),
    );

    const windowListener = app.windowManager.added.addEventListener(
      (windowComponent) => {
        if (windowComponent.id === categoryManagerWindowId) {
          categoryManagerAction.hasUpdate = false;
        }
      },
    );

    return () => {
      app.windowManager.remove(categoryManagerWindowId);
      app.navbarManager.remove(categoryManagerWindowId);
      destroy();
      addedListener();
      removedListener();
      collectionListeners.forEach((value) => value());
      windowListener();
    };
  }

  /**
   * This helper sets up a listener to sync the theming relevant keys from the {@see UiConfigObject}
   * with a given vuetify instance. Use this helper, if you do not use the VcsApp component and wish to evaluate
   * the theming keys. Returns a function to stop syncing.
   * Also adds a watcher to vuetify theme, which triggers themeChanged event on the VcsUiApp.
   * @param {import("../vcsUiApp.js").default} app
   * @returns {function():void} - call to stop syncing
   */
  export function setupUiConfigTheming(app) {
    function updateTheme(item) {
      if (item.name === 'primaryColor' || item.name === 'vuetifyTheme') {
        const mergedThemes = createVcsThemes(
          app.uiConfig.getByKey('vuetifyTheme')?.value,
          app.uiConfig.getByKey('primaryColor')?.value,
        );
        setTheme(app.vuetify, mergedThemes);
        app.themeChanged.raiseEvent();
      }
    }
    const listeners = [
      app.uiConfig.added.addEventListener(updateTheme),
      app.uiConfig.removed.addEventListener(updateTheme),
    ];
    const stopWatching = watch(
      () => app.vuetify.theme.current.value.dark,
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
   * This helper sets up a listener to sync the display quality settings from the {@see UiConfigObject}
   * @param {import("../vcsUiApp.js").default} app
   * @returns {function():void} - call to stop syncing
   */
  export function setupUiConfigDisplayQuality(app) {
    const listeners = [
      app.uiConfig.added.addEventListener((item) => {
        if (item.name === 'displayQuality') {
          app.displayQuality.updateOptions(item.value);
        }
      }),
      app.uiConfig.removed.addEventListener((item) => {
        if (item.name === 'displayQuality') {
          app.displayQuality.updateOptions({});
        }
      }),
    ];

    return () => {
      listeners.forEach((cb) => {
        cb();
      });
      listeners.splice(0);
    };
  }

  export const attributionsComponentId = 'attributionId';

  /**
   * This helper gets attributions of all active maps, layers and oblique collections and returns an array of entries.
   * It also returns a attributionAction to toggle the attributions window and a destroy function.
   * @param {import("../vcsUiApp.js").default} app
   * @returns {{ attributionEntries: import("vue").Ref<Array<import("./attributionsHelper.js").AttributionEntry>>, attributionAction: import("../actions/actionHelper.js").VcsAction, destroyAttributions: function():void }}
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
          id: attributionsComponentId,
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
   * @description The base component to setup the entire application. To embed the VcsApp, use this component.
   * @vue-prop {string} appId - the id of the app to inject. this will setup listeners on the app to call vcsAppMounted on plugins
   * @vue-provide
   */
  export default {
    components: {
      VcsContainer,
      VcsPositionDisplay,
      VcsAttributionsFooter,
      VcsTextPageFooter,
      VcsObliqueFooter,
      VcsSplashScreen,
      VcsNavbar,
      VcsNavbarMobile,
      VContainer,
      VFooter,
      VSpacer,
    },
    props: {
      appId: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      /** @type {import("../vcsUiApp.js").default} */
      const app = getVcsAppById(props.appId);
      provide('vcsApp', app);
      const mapNavbarListener = setupUIConfigDependency(
        app,
        setupMapNavbar,
        'hideMapButtons',
      );
      const legendDestroy = setupUIConfigDependency(
        app,
        setupLegendWindow,
        'hideLegend',
      );
      const settingsDestroy = setupUIConfigDependency(
        app,
        setupSettingsWindow,
        'hideSettings',
      );
      const stopCustomScreen = setupCustomScreen(app);
      const { showSplashScreen } = app.uiConfig;
      const stopSplashScreen = setupSplashScreen(app);
      setupHelpButton(app);
      const destroyMyWorkspace = setupUIConfigDependency(
        app,
        setupCategoryManagerWindow,
        'hideMyWorkspace',
      );
      const destroyThemingListener = setupUiConfigTheming(app);
      const destroyDisplayQualityListener = setupUiConfigDisplayQuality(app);
      const { attributionEntries, attributionAction, destroyAttributions } =
        setupAttributions(app);
      const destroyDeepPicking = setupDeepPicking(app);

      let pluginMountedListener;
      onMounted(() => {
        pluginMountedListener = setupPluginMountedListeners(app);
      });

      function getSplashScreenConfig() {
        if (app.uiConfig.config.splashScreen) {
          if (shouldShowSplashSceen(app)) {
            showSplashScreen.value = true;
          }
          return {
            title: 'components.splashScreen.name',
            tooltip: 'components.splashScreen.tooltip',
            ...app.uiConfig.config.splashScreen,
          };
        }
        return undefined;
      }
      const splashScreen = shallowRef(getSplashScreenConfig());
      app.uiConfig.added.addEventListener(({ name }) => {
        if (name === 'splashScreen') {
          splashScreen.value = getSplashScreenConfig();
        }
      });

      onUnmounted(() => {
        if (pluginMountedListener) {
          pluginMountedListener();
        }
        mapNavbarListener();
        legendDestroy();
        settingsDestroy();
        stopCustomScreen();
        stopSplashScreen();
        destroyMyWorkspace();
        destroyThemingListener();
        destroyDisplayQualityListener();
        destroyAttributions();
        destroyDeepPicking();
      });

      const { smAndUp, xs } = useDisplay();

      const mobileLandscape = isMobileLandscape();

      const fontSize = useFontSize();
      const footerHeight = computed(() => {
        return Math.ceil(fontSize.value * 1.65);
      });

      return {
        config: app.uiConfig.config,
        showFooter: computed(() => {
          return !app.uiConfig.config.hideFooter && smAndUp.value;
        }),
        footerHeight,
        mobileLogo: computed(
          () =>
            app.uiConfig.config.mobileLogo ??
            app.uiConfig.config.logo ??
            VcsDefaultLogoMobile,
        ),
        imprint: computed(() => {
          if (app.uiConfig.config.imprint) {
            return {
              title: 'footer.imprint.title',
              tooltip: 'footer.imprint.tooltip',
              ...app.uiConfig.config.imprint,
            };
          }
          return undefined;
        }),
        dataProtection: computed(() => {
          if (app.uiConfig.config.dataProtection) {
            return {
              title: 'footer.dataProtection.title',
              tooltip: 'footer.dataProtection.tooltip',
              ...app.uiConfig.config.dataProtection,
            };
          }
          return undefined;
        }),
        showSplashScreen,
        splashScreen,
        attributionEntries,
        attributionAction,
        smAndUp,
        xs,
        mobileLandscape,
      };
    },
  };
</script>

<style scoped lang="scss">
  :deep(.v-application--wrap) {
    min-height: fit-content;
  }
  .mobileRotatedWarning {
    bottom: 0px;
    z-index: 5;
    position: fixed;
    background-color: rgba(var(--v-theme-surface-light), 0.5);
    color: rgb(var(--v-theme-on-surface));
    backdrop-filter: blur(1px);
    -webkit-backdrop-filter: blur(1px);
    padding: 5px;
    border-radius: 4px;
  }
</style>
