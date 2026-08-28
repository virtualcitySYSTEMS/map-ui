<script setup lang="ts">
  import { getVcsAppById, moduleIdSymbol } from '@vcmap/core';
  import type { Reactive, Ref, WatchStopHandle } from 'vue';
  import {
    computed,
    onMounted,
    onUnmounted,
    provide,
    watch,
    shallowRef,
  } from 'vue';
  import { useDisplay } from 'vuetify';
  import { VContainer, VFooter, VSpacer } from 'vuetify/components';
  import type { VcsAction } from '../actions/actionHelper.js';
  import {
    createLinkAction,
    createToggleAction,
  } from '../actions/actionHelper.js';
  import { setupDeepPicking } from '../actions/deepPickingAction.js';
  import {
    getLayerLegend,
    getLegendEntries,
    getStyleLegend,
  } from '../legend/legendHelper.js';
  import VcsLegend from '../legend/VcsLegend.ts.vue';
  import { ButtonLocation } from '../manager/navbarManager.js';
  import {
    createVcsThemes,
    isMobileLandscape,
    useFontSize,
    setTheme,
  } from '../vuePlugins/vuetify.js';
  import { vcsAppSymbol } from '../pluginHelper.js';
  import type {
    UiConfigurationItem,
    UiConfigObject,
    SplashScreen,
  } from '../uiConfig.js';
  import { isUiConfigurationItem } from '../uiConfig.js';
  import type VcsUiApp from '../vcsUiApp.js';
  import type { AttributionEntry } from './attributionsHelper.js';
  import { getAttributions } from './attributionsHelper.js';
  import {
    getDataProtection,
    getImprint,
    getFooterInformation,
  } from './uiConfigHelper.js';
  import {
    attributionsComponentId,
    customScreenComponentId,
    helpComponentId,
    legendComponentId,
    settingsComponentId,
    splashScreenComponentId,
    setupCategoryManagerWindow,
    setupMapNavbar,
    setupPluginMountedListeners,
  } from './vcsAppHelper.js';
  import VcsAttributions from './VcsAttributions.ts.vue';
  import VcsAttributionsFooter from './VcsAttributionsFooter.ts.vue';
  import VcsContainer from './VcsContainer.ts.vue';
  import VcsNavbar from './VcsNavbar.ts.vue';
  import VcsNavbarMobile from './VcsNavbarMobile.ts.vue';
  import VcsObliqueFooter from './VcsObliqueFooter.ts.vue';
  import VcsPanoramaFooter from './VcsPanoramaFooter.ts.vue';
  import VcsPositionDisplay from './VcsPositionDisplay.ts.vue';
  import VcsSplashScreen, {
    shouldShowSplashSceen,
  } from './VcsSplashScreen.ts.vue';
  import VcsTextPage from './VcsTextPage.ts.vue';
  import VcsTextPageFooter from './VcsTextPageFooter.ts.vue';
  import VcsSettings from './VcsSettings.ts.vue';

  /**
   * This helper gets attributions of all active maps, layers and oblique collections and returns an array of entries.
   * It also returns a attributionAction to toggle the attributions window and a destroy function.
   */
  function setupAttributions(app: VcsUiApp): {
    attributionEntries: Reactive<Array<AttributionEntry>>;
    attributionAction: VcsAction;
    destroyAttributions: () => void;
  } {
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
          slot: 'dynamicRight',
          props: { entries },
        },
        app.windowManager,
        vcsAppSymbol,
      );

    return {
      attributionEntries: entries,
      attributionAction,
      destroyAttributions: (): void => {
        destroy();
        attributionDestroy();
      },
    };
  }

  /**
   * This helper function will add a customScreen action button to the apps NavbarManager MENU location.
   */
  function setupCustomScreen(app: VcsUiApp): () => void {
    function setupCustomScreenAction() {
      const { customScreen } = app.uiConfig.config;
      const { action: customScreenAction, destroy: customScreenDestroy } =
        createToggleAction(
          {
            name: customScreen?.name || 'components.customScreen.name',
            icon: customScreen?.icon || 'mdi-information',
            title: customScreen?.title,
          },
          {
            id: customScreenComponentId,
            component: VcsTextPage,
            state: {
              headerIcon: customScreen?.icon,
              headerTitle: customScreen?.name,
            },
            slot: 'detached',
            position: customScreen?.windowPosition,
            props: { content: customScreen?.content },
          },
          app.windowManager,
          vcsAppSymbol,
        );
      app.navbarManager.add(
        { id: customScreenComponentId, action: customScreenAction },
        vcsAppSymbol,
        ButtonLocation.MENU,
        { mobile: true, tablet: true, desktop: true },
      );
      return (): void => {
        customScreenDestroy();
      };
    }
    let customScreen: (() => void) | null = null;
    const stopCustomScreenWatcher = watch(
      () => app.uiConfig.config.customScreen,
      (newCustomScreen) => {
        if (app.navbarManager.has(customScreenComponentId)) {
          app.navbarManager.remove(customScreenComponentId);
        }
        if (newCustomScreen) {
          customScreen?.();
          customScreen = setupCustomScreenAction();
        }
      },
      { immediate: true },
    );
    return (): void => {
      if (customScreen) {
        customScreen();
      }
      stopCustomScreenWatcher();
    };
  }

  /**
   * This helper function will add a help action button referencing VC Map help page to the apps NavbarManager MENU location.
   */
  function setupHelpButton(app: VcsUiApp): void {
    const helpAction = createLinkAction(
      { name: 'help.title', title: 'help.tooltip', icon: '$vcsHelp' },
      app.getHelpUrlCallback(),
    );
    app.navbarManager.add(
      { id: helpComponentId, action: helpAction },
      vcsAppSymbol,
      ButtonLocation.MENU,
      { mobile: true, tablet: true, desktop: true },
    );
  }

  /**
   * This helper function will add a legend action button to the apps NavbarManager TOOL location, if legend entries are available.
   * Watches number of legend entries.
   * @param xs - Whether the screen size is extra small
   */
  function setupLegendWindow(app: VcsUiApp, xs: Ref<boolean>): () => void {
    const { entries, destroy } = getLegendEntries(app);

    const { action: legendAction, destroy: legendDestroy } = createToggleAction(
      { name: 'legendToggle', icon: '$vcsLegend', title: 'legend.tooltip' },
      {
        id: legendComponentId,
        component: VcsLegend,
        state: {
          headerTitle: 'legend.title',
          headerIcon: '$vcsLegend',
          infoUrlCallback: app.getHelpUrlCallback(
            '/components/contentspace.html#id_legend',
          ),
        },
        slot: 'dynamicRight',
        props: { entries },
      },
      app.windowManager,
      vcsAppSymbol,
    );

    /**
     * Adds a legend button, if not existing
     */
    const addLegend = (): void => {
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
    const handleLegend = (): void => {
      const layersWithLegend = [...app.layers].filter(getLayerLegend);
      const stylesWithLegend = [...app.styles].filter(getStyleLegend);
      if (layersWithLegend.length < 1 && stylesWithLegend.length < 1) {
        app.navbarManager.remove(legendComponentId);
        app.windowManager.remove(legendComponentId);
      } else {
        addLegend();
      }
    };

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
              infoUrlCallback: app.getHelpUrlCallback(
                '/components/contentspace.html#id_legend',
              ),
            },
            slot: 'dynamicRight',
            props: { entries },
          },
          vcsAppSymbol,
        );
      }

      if (
        app.uiConfig.config.autoCloseLegend &&
        newValue.length === 0 &&
        app.windowManager.has(legendComponentId)
      ) {
        app.windowManager.remove(legendComponentId);
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

    return (): void => {
      watchEntries();
      app.navbarManager.remove(legendComponentId);
      app.windowManager.remove(legendComponentId);
      destroy();
      legendDestroy();
      listeners.forEach((cb) => {
        cb();
      });
    };
  }

  /**
   * This helper function will add a settings action button to the apps NavbarManager MENU location.
   */
  function setupSettingsWindow(app: VcsUiApp): () => void {
    const { action: settingsAction, destroy: settingsDestroy } =
      createToggleAction(
        { name: 'settings.title', icon: 'mdi-cog', title: 'settings.tooltip' },
        {
          id: settingsComponentId,
          component: VcsSettings,
          state: { headerIcon: 'mdi-cog', headerTitle: 'settings.title' },
          slot: 'dynamicRight',
        },
        app.windowManager,
        vcsAppSymbol,
      );
    app.navbarManager.add(
      { id: settingsComponentId, action: settingsAction },
      vcsAppSymbol,
      ButtonLocation.MENU,
      { mobile: true, tablet: true, desktop: true },
    );
    return (): void => {
      app.navbarManager.remove(settingsComponentId);
      app.windowManager.remove(settingsComponentId);
      settingsDestroy();
    };
  }

  /**
   * This helper function will add a Splash Screen action button to the apps NavbarManager MENU location.
   */
  function setupSplashScreen(app: VcsUiApp): WatchStopHandle {
    const { config, showSplashScreen } = app.uiConfig;
    function setupSplashScreenAction(
      moduleId: string = app.dynamicModuleId,
    ): void {
      const { splashScreen } = config;
      if (splashScreen && moduleId !== app.dynamicModuleId) {
        showSplashScreen.value = shouldShowSplashSceen(app);
      }
      if (splashScreen && splashScreen.menuEntry) {
        const splashScreenAction: VcsAction = {
          name: splashScreen.name || 'components.splashScreen.name',
          icon: splashScreen.icon || 'mdi-alert-box',
          title: splashScreen.title,
          callback(): void {
            showSplashScreen.value = !showSplashScreen.value;
          },
        };
        app.navbarManager.add(
          { id: splashScreenComponentId, action: splashScreenAction },
          vcsAppSymbol,
          ButtonLocation.MENU,
          { mobile: true, tablet: true, desktop: true },
        );
      }
    }
    setupSplashScreenAction();
    const removeAddedListener = app.uiConfig.added.addEventListener((item) => {
      if (isUiConfigurationItem(item, 'splashScreen')) {
        if (app.navbarManager.has(splashScreenComponentId)) {
          app.navbarManager.remove(splashScreenComponentId);
        }
        setupSplashScreenAction(item[moduleIdSymbol]);
      }
    });
    const removeRemovedListener = app.uiConfig.removed.addEventListener(
      (item) => {
        if (isUiConfigurationItem(item, 'splashScreen')) {
          if (app.navbarManager.has(splashScreenComponentId)) {
            app.navbarManager.remove(splashScreenComponentId);
          }
        }
      },
    );
    return (): void => {
      removeAddedListener();
      removeRemovedListener();
    };
  }

  /**
   * This helper checks the uiConfig and depending on the value will setup/teardown the providedSetupFunction
   * @param configOption parameter name of a uiConfig parameter, for example `app.uiConfig.config.hideContentTree`
   * @param additionalOptions Additional options to pass to the setup function
   * @returns a cleanup function
   */
  function setupUIConfigDependency(
    app: VcsUiApp,
    setupFunction: (app: VcsUiApp, ...args: Array<Ref<boolean>>) => () => void,
    configOption: string,
    additionalOptions: Array<Ref<boolean>> = [],
  ): () => void {
    let destroyFunction: (() => void) | null = null;
    function handler(): void {
      if (!app.uiConfig.config[configOption] && !destroyFunction) {
        destroyFunction = setupFunction(app, ...additionalOptions);
      } else if (app.uiConfig.config[configOption] && destroyFunction) {
        destroyFunction();
        destroyFunction = null;
      }
    }
    handler();
    const listeners = [
      app.uiConfig.added.addEventListener(handler),
      app.uiConfig.removed.addEventListener(handler),
    ];

    return (): void => {
      if (destroyFunction) {
        destroyFunction();
      }
      listeners.forEach((cb) => {
        cb();
      });
    };
  }

  /**
   * This helper sets up a listener to sync the display quality settings from the {@see UiConfigObject}
   * @returns - call to stop syncing
   */
  function setupUiConfigDisplayQuality(app: VcsUiApp): () => void {
    const listeners = [
      app.uiConfig.added.addEventListener((item) => {
        if (isUiConfigurationItem(item, 'displayQuality')) {
          app.displayQuality.updateOptions(item.value);
        }
      }),
      app.uiConfig.removed.addEventListener((item) => {
        if (isUiConfigurationItem(item, 'displayQuality')) {
          app.displayQuality.updateOptions({});
        }
      }),
    ];

    return (): void => {
      listeners.forEach((cb) => {
        cb();
      });
      listeners.splice(0);
    };
  }

  /**
   * This helper sets up a listener to sync the theming relevant keys from the {@see UiConfigObject}
   * with a given vuetify instance. Use this helper, if you do not use the VcsApp component and wish to evaluate
   * the theming keys. Returns a function to stop syncing.
   * Also adds a watcher to vuetify theme, which triggers themeChanged event on the VcsUiApp.
   * @returns - call to stop syncing
   */
  function setupUiConfigTheming(app: VcsUiApp): () => void {
    function updateTheme(item: UiConfigurationItem<unknown>): void {
      if (
        isUiConfigurationItem(item, 'primaryColor') ||
        isUiConfigurationItem(item, 'vuetifyTheme')
      ) {
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
      () => {
        app.themeChanged.raiseEvent();
      },
    );

    return (): void => {
      listeners.forEach((cb) => {
        cb();
      });
      listeners.splice(0);
      stopWatching();
    };
  }

  /**
   * @description The base component to setup the entire application. To embed the VcsApp, use this component.
   * @vue-prop {string} appId - the id of the app to inject. this will setup listeners on the app to call vcsAppMounted on plugins
   * @vue-provide
   */
  const props = defineProps<{ appId: string }>();

  const app = getVcsAppById(props.appId) as VcsUiApp;
  provide('vcsApp', app);

  const uiConfig = app.uiConfig.config as UiConfigObject;
  const { smAndUp, xs } = useDisplay();
  const mapNavbarListener = setupUIConfigDependency(
    app,
    setupMapNavbar,
    'hideMapButtons',
  );
  const legendDestroy = setupUIConfigDependency(
    app,
    setupLegendWindow,
    'hideLegend',
    [xs],
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

  let pluginMountedListener: (() => void) | null = null;
  onMounted(() => {
    pluginMountedListener = setupPluginMountedListeners(app);
  });

  function getSplashScreenConfig():
    | UiConfigurationItem<SplashScreen>
    | undefined {
    if (uiConfig.splashScreen) {
      if (shouldShowSplashSceen(app)) {
        showSplashScreen.value = true;
      }
      return {
        ...(uiConfig.splashScreen as UiConfigurationItem<SplashScreen>),
        name: 'components.splashScreen.name',
      };
    }
    return undefined;
  }
  const splashScreen = shallowRef(getSplashScreenConfig());
  app.uiConfig.added.addEventListener((item) => {
    if (isUiConfigurationItem(item, 'splashScreen')) {
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

  const mobileLandscape = isMobileLandscape();

  const fontSize = useFontSize();
  const footerHeight = computed(() => Math.ceil(fontSize.value * 1.65));
  const showFooter = computed(() => !uiConfig.hideFooter && smAndUp.value);
  const imprint = getImprint(uiConfig);
  const dataProtection = getDataProtection(uiConfig);
  const footerInformation = getFooterInformation(uiConfig);
</script>

<template>
  <v-container class="fill-height pa-0 vcs-app" absolute fluid>
    <VcsSplashScreen
      v-if="splashScreen"
      :options="splashScreen"
      v-model="showSplashScreen"
    ></VcsSplashScreen>
    <VcsNavbar v-if="!uiConfig.hideHeader && smAndUp && !mobileLandscape" />
    <VcsNavbarMobile v-if="!uiConfig.hideHeader && xs && !mobileLandscape" />
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
      <vcs-panorama-footer />
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
      <VcsTextPageFooter
        v-for="(info, idx) in footerInformation"
        :key="idx"
        :text-page="info"
        :window-id="'footerInfoWindow_' + idx"
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

<style scoped lang="scss">
  :deep(.v-application--wrap) {
    min-height: fit-content;
  }
  .mobileRotatedWarning {
    bottom: 0px;
    z-index: 5;
    position: fixed;
    background-color: rgb(from rgb(var(--v-theme-surface-light)) / 0.5);
    color: rgb(var(--v-theme-on-surface));
    backdrop-filter: blur(1px);
    -webkit-backdrop-filter: blur(1px);
    padding: 5px;
    border-radius: 4px;
  }
</style>
