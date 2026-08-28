import type { Component, Reactive } from 'vue';
import type {
  OverrideCollection,
  VcsModuleConfig,
  VcsModule,
} from '@vcmap/core';
import {
  Collection,
  defaultDynamicModuleId,
  destroyCollection,
  getObjectFromClassRegistry,
  makeOverrideCollection,
  moduleIdSymbol,
  ObliqueMap,
  OverrideClassRegistry,
  VcsApp,
  VcsEvent,
  Viewpoint,
  volatileModuleId,
  WMSLayer,
  getCaughtError,
} from '@vcmap/core';
import type { Logger } from '@vcsuite/logger';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import type { Composer, I18n } from 'vue-i18n';
import type { createVuetify } from 'vuetify';
import type {
  pluginBaseUrlSymbol,
  pluginFactorySymbol,
  pluginModuleUrlSymbol,
  pluginVersionRangeSymbol,
  vcsAppSymbol,
} from './pluginHelper.js';
import { deserializePlugin, serializePlugin } from './pluginHelper.js';
import ToolboxManager, {
  setupDefaultGroups,
} from './manager/toolbox/toolboxManager.js';
import WindowManager from './manager/window/windowManager.js';
import PanelManager from './manager/panel/panelManager.js';
import NavbarManager from './manager/navbarManager.js';
import { createContentTreeCollection } from './contentTree/contentTreeCollection.js';
import type ContentTreeCollection from './contentTree/contentTreeCollection.js';
import type ContentTreeItem from './contentTree/contentTreeItem.js';
import {
  contentTreeClassRegistry,
  type ContentTreeItemOptions,
} from './contentTree/contentTreeItem.js';
import OverviewMap from './navigation/overviewMap.js';
import I18nCollection, {
  type I18nConfigurationItem,
} from './i18n/i18nCollection.js';
import CategoryManager from './manager/collectionManager/categoryManager.js';
import ContextMenuManager from './manager/contextMenu/contextMenuManager.js';
import FeatureInfo, {
  featureInfoClassRegistry,
} from './featureInfo/featureInfo.js';
import type { UiConfigurationItem } from './uiConfig.js';
import UiConfig from './uiConfig.js';
import {
  createEmptyState,
  getStateFromURL,
  parseWMSStyle,
  writeWMSStyleForLayer,
} from './state.js';
import type {
  AppState,
  CachedAppState,
  ClippingPolygonState,
  LayerState,
  PluginState,
} from './state.js';
import packageJson from '../package.json' with { type: 'json' };
import Search from './search/search.js';
import Notifier from './notifier/notifier.js';
import type { FeatureInfoViewOptions } from './featureInfo/abstractFeatureInfoView.js';
import AbstractFeatureInfoView from './featureInfo/abstractFeatureInfoView.js';
import { createVueI18n, setupI18n } from './vuePlugins/i18n.js';
import type VcsCallback from './callback/vcsCallback.js';
import { callbackClassRegistry } from './callback/vcsCallback.js';
import createSiteConfig from './siteConfig.js';
import { createVcsVuetify } from './vuePlugins/vuetify.js';
import createObliqueFallbackWarnings from './obliqueFallbackWarnings.js';

type VcsUiModuleConfig = VcsModuleConfig & {
  plugins?: SerializedPluginConfig[];
  contentTree?: ContentTreeItemOptions[];
  uiConfig?: UiConfigurationItem<unknown>[];
  featureInfo?: FeatureInfoViewOptions[];
  i18n?: I18nConfigurationItem[];
};

export type PluginConfig = {
  name: string;
  /** path to the plugin's entry file */
  entry?: string;
  /** version or version range */
  version?: string;
  mapVersion?: string;
};

export type SerializedPluginConfig = PluginConfig &
  Record<string | symbol, unknown>;

type PluginConfigEditorComponent<C extends object = PluginConfig> = Component<{
  getConfig(): C;
  setConfig(config?: C): void;
}>;

type PluginConfigEditor<C extends object = PluginConfig> = {
  /** an editor component for the plugin or item */
  component: PluginConfigEditorComponent<C>;
  /** optional title to render in the window header & actions of this editor */
  title?: string;
  /** the collection the item belongs to. Default is plugins collection. */
  collectionName?: string;
  /** the item the editor can be used for. Can be a name or className. Default is the plugin's name. */
  itemName?: string;
  /** An optional function returning an url referencing help or further information regarding the config editor. */
  infoUrlCallback?: () => string;
};

export type VcsPlugin<
  C extends Record<string, unknown> = Record<string, unknown>,
  S extends Record<string, unknown> = Record<string, unknown>,
> = {
  name: string;
  version: string;
  mapVersion: string;
  i18n?: Record<string, unknown>;
  /** called on plugin added, is passed the VcsUiApp and optionally, the state for the plugin */
  initialize?: (app: VcsUiApp, state?: S) => void | Promise<void>;
  /** called on mounted of VcsApp.ts.vue */
  onVcsAppMounted?: (app: VcsUiApp) => void;
  /** should return the plugin's serialization excluding all default values */
  toJSON?: () => C;
  /** should return the plugin's default options */
  getDefaultOptions?: () => C;
  /** should return the plugin's state or a promise for said state. is passed a "for url" flag. If true, only the state relevant for sharing a URL should be passed and short keys shall be used */
  getState?: (forUrl?: boolean) => S | Promise<S>;
  /** should return components for configuring the plugin or custom items defined by the plugin */
  getConfigEditors?: () => PluginConfigEditor<C>[];
  destroy?: () => void;
  [pluginFactorySymbol]?: (
    config: SerializedPluginConfig,
  ) => Promise<VcsPlugin>;
  [pluginBaseUrlSymbol]?: string;
  [pluginModuleUrlSymbol]?: string;
  [pluginVersionRangeSymbol]?: string;
  [moduleIdSymbol]?: string;
};

export type VcsComponentManager<T extends object, O extends object> = {
  added: VcsEvent<T>;
  removed: VcsEvent<T>;
  /** all registered component ids as a reactive array */
  componentIds: Reactive<Array<string>>;
  get: (id: string) => T | undefined;
  has: (id: string) => boolean;
  remove: (id: string) => void;
  add: (options: O, owner: string | typeof vcsAppSymbol) => T;
  /** remove all components of the owner */
  removeOwner: (owner: string | typeof vcsAppSymbol) => void;
  /** remove all registered components */
  clear: () => void;
  destroy: () => void;
};

function getLogger(): Logger {
  return getLoggerByName('VcsUiApp');
}

class VcsUiApp extends VcsApp {
  /**
   * Gets the version of the @vcmap/ui npm package
   */
  static getVersion(): string {
    return packageJson.version;
  }

  /**
   * An event triggered when the vuetify theme mode changes or the primary color is updated by a new uiConfig entry.
   */
  themeChanged = new VcsEvent<void>();

  private _plugins: OverrideCollection<
    VcsPlugin,
    Collection<VcsPlugin>,
    SerializedPluginConfig
  > = makeOverrideCollection<
    VcsPlugin,
    Collection<VcsPlugin>,
    SerializedPluginConfig
  >(
    new Collection<VcsPlugin>(),
    () => this.dynamicModuleId,
    serializePlugin,
    // deserializePlugin resolves to null on failure, which the makeOverrideCollection callers already handle at runtime
    deserializePlugin as (
      item: SerializedPluginConfig,
    ) => Promise<VcsPlugin> | null,
  );
  /**
   * I18n Collection adds plugin listener first, so the plugin i18n data is available on plugin initialize
   * @type {I18nCollection<Object>}
   */
  private _i18n: OverrideCollection<
    I18nConfigurationItem,
    I18nCollection,
    I18nConfigurationItem
  > = makeOverrideCollection(
    new I18nCollection(this._plugins),
    () => this.dynamicModuleId,
  );

  private _pluginListeners: Array<() => void> = [];

  private _vueI18nPlugin: I18n = createVueI18n();

  private _vuetify: ReturnType<typeof createVcsVuetify> = createVcsVuetify(
    this._vueI18nPlugin,
  );

  private _vueI18n: Composer = this._vueI18nPlugin.global as Composer;

  private _vueI18nDestroy: () => void = setupI18n(this);

  private _callbackClassRegistry = new OverrideClassRegistry<
    typeof VcsCallback
  >(callbackClassRegistry);

  private _contentTreeClassRegistry = new OverrideClassRegistry<
    typeof ContentTreeItem
  >(contentTreeClassRegistry);
  private _uiConfig: UiConfig &
    OverrideCollection<UiConfigurationItem<unknown>, UiConfig> = new UiConfig(
    () => this.dynamicModuleId,
  ) as UiConfig & OverrideCollection<UiConfigurationItem<unknown>, UiConfig>;

  private _contentTree = createContentTreeCollection(this);

  private _toolboxManager = new ToolboxManager();

  private _windowManager = new WindowManager();

  private _panelManager = new PanelManager();

  private _navbarManager = new NavbarManager();

  private _search = new Search(this);

  private _featureInfoClassRegistry = new OverrideClassRegistry<
    typeof AbstractFeatureInfoView
  >(featureInfoClassRegistry);

  private _featureInfo = makeOverrideCollection(
    new FeatureInfo(this),
    () => this.dynamicModuleId,
    undefined,
    (config) =>
      getObjectFromClassRegistry(this._featureInfoClassRegistry, config),
    AbstractFeatureInfoView,
  );

  private _overviewMap = new OverviewMap(this);

  private _categoryManager = new CategoryManager(this);

  private _contextMenuManager = new ContextMenuManager(this);

  private _notifier = new Notifier();

  private _cachedAppState: CachedAppState = getStateFromURL(
    new URL(window.location.href),
  );

  /**
   * An event triggered when the VcsApp was mounted and a target was set for the maps.
   * Provides the id of the target html element.
   *  */
  mounted = new VcsEvent<string>();

  private _destroySiteConfig: () => void = createSiteConfig(this._uiConfig);

  private _destroyObliqueFallback: () => void =
    createObliqueFallbackWarnings(this);

  constructor() {
    super();

    this._pluginListeners = [
      this._plugins.added.addEventListener((plugin) => {
        this._windowManager.removeOwner(plugin.name);
        this._panelManager.removeOwner(plugin.name);
        this._navbarManager.removeOwner(plugin.name);
        this._toolboxManager.removeOwner(plugin.name);
        this._categoryManager.removeOwner(plugin.name);
        this._contextMenuManager.removeOwner(plugin.name);
        this._search.removeOwner(plugin.name);
        // i18n messages of the plugin are added by the i18n collection
        if (plugin.initialize) {
          let state: PluginState<unknown> | undefined;
          if (
            plugin[moduleIdSymbol] &&
            this._cachedAppState.moduleIds.includes(plugin[moduleIdSymbol])
          ) {
            state = this._cachedAppState.plugins.find(
              (s: PluginState<unknown>) => s.name === plugin.name,
            );
          }

          const logError = (e: unknown): void => {
            getLogger().error(
              `Error in plugin ${plugin.name} initialize hook`,
              e,
            );
          };

          try {
            const optPromise = plugin.initialize(
              this,
              state?.state as Record<string, unknown> | undefined,
            );
            if (optPromise instanceof Promise) {
              optPromise.catch(logError);
            }
          } catch (e) {
            logError(e);
          }
        }
      }),
      this._plugins.removed.addEventListener((plugin) => {
        this._windowManager.removeOwner(plugin.name);
        this._panelManager.removeOwner(plugin.name);
        this._navbarManager.removeOwner(plugin.name);
        this._toolboxManager.removeOwner(plugin.name);
        this._categoryManager.removeOwner(plugin.name);
        this._contextMenuManager.removeOwner(plugin.name);
        this._search.removeOwner(plugin.name);
        // i18n messages of the plugin are removed by the i18n collection
      }),
    ];

    setupDefaultGroups(this._toolboxManager);
  }

  get plugins(): OverrideCollection<
    VcsPlugin,
    Collection<VcsPlugin>,
    SerializedPluginConfig
  > {
    return this._plugins;
  }
  get contentTree(): ContentTreeCollection {
    return this._contentTree;
  }
  get callbackClassRegistry(): OverrideClassRegistry<typeof VcsCallback> {
    return this._callbackClassRegistry;
  }
  get contentTreeClassRegistry(): OverrideClassRegistry<
    typeof ContentTreeItem
  > {
    return this._contentTreeClassRegistry;
  }
  get featureInfoClassRegistry(): OverrideClassRegistry<
    typeof AbstractFeatureInfoView
  > {
    return this._featureInfoClassRegistry;
  }
  get toolboxManager(): ToolboxManager {
    return this._toolboxManager;
  }
  get windowManager(): WindowManager {
    return this._windowManager;
  }
  get panelManager(): PanelManager {
    return this._panelManager;
  }
  get navbarManager(): NavbarManager {
    return this._navbarManager;
  }
  get featureInfo(): FeatureInfo {
    return this._featureInfo;
  }
  get overviewMap(): OverviewMap {
    return this._overviewMap;
  }
  get i18n(): I18nCollection {
    return this._i18n;
  }
  get vueI18nPlugin(): I18n {
    return this._vueI18nPlugin;
  }
  get vuetify(): ReturnType<typeof createVuetify> {
    return this._vuetify;
  }
  get vueI18n(): Composer {
    return this._vueI18n;
  }
  get categoryManager(): CategoryManager {
    return this._categoryManager;
  }
  get contextMenuManager(): ContextMenuManager {
    return this._contextMenuManager;
  }
  get search(): Search {
    return this._search;
  }
  get uiConfig(): UiConfig &
    OverrideCollection<UiConfigurationItem<unknown>, UiConfig> {
    return this._uiConfig;
  }
  get notifier(): Notifier {
    return this._notifier;
  }

  /**
   * Returns a callback function providing a URL to help page.
   * The default helpBaseUrl can be changed by adding an 'helpBaseUrl' item to the UiConfig Collection.
   * The callback derives the url from the VC Map mayor and minor version, the current app locale and a provided path pointing to a specific help section.
   * This function can be used for the WindowState infoUrlCallback property.
   * @param path the path to a help section
   * @param subpage path to a subpage. Default is 'vc-map'.
   * @param subpageVersion - default version is the mapVersion, can be provided to use a plugin specific version
   */
  getHelpUrlCallback(
    path = '',
    subpage = 'vc-map',
    subpageVersion = VcsUiApp.getVersion(),
  ): () => string {
    const mayorMinorVersion = /\d+\.\d+/.exec(subpageVersion)?.[0];
    return () => {
      const base =
        this.uiConfig.config.helpBaseUrl || 'https://help.vc.systems/';
      const url = `${
        this.locale
      }/${subpage}/v${mayorMinorVersion}/${path.replace(/^\//, '')}`;
      const { href } = new URL(url, base);
      return href;
    };
  }

  /**
   * Get the state of the application. When passed the forUrl flag, only a minimal set of states shall be provided for a sharable link to the current state (to ensure
   * the maximum URL length is not exceeded). This includes: layer active state & styling, active map, active viewpoint,
   * currently selected feature info & any state deemed required for a sharable URL by the currently loaded plugins.
   */
  async getState(forUrl?: boolean): Promise<AppState> {
    const state = createEmptyState();
    const { activeMap } = this.maps;
    if (!activeMap) {
      return state;
    }

    const nonDynamicModules = this.modules.filter(
      ({ _id }) => _id !== defaultDynamicModuleId,
    );

    if (nonDynamicModules.some((m) => !m.config._id)) {
      getLogger().warning(
        'Some modules you are creating are missing a stable _id property. This may lead to issues while restoring application state.',
      );
    }

    state.moduleIds = nonDynamicModules.map(({ _id }) => _id);

    state.activeMap = activeMap.name;
    const viewpoint = await activeMap.getViewpoint();
    state.activeViewpoint = viewpoint?.isValid?.()
      ? viewpoint.toJSON()
      : undefined;
    state.layers = [...this.layers]
      .filter((l) => {
        const layerWithStyle = l as typeof l & {
          style?: { name: string; [moduleIdSymbol]?: string };
          defaultStyle?: { name: string };
        };

        return (
          l.isSupported(activeMap) &&
          l[moduleIdSymbol] !== defaultDynamicModuleId &&
          l[moduleIdSymbol] !== volatileModuleId &&
          (((l.active || l.loading) && !l.activeOnStartup) ||
            (!l.active && l.activeOnStartup) ||
            ((l.active || l.loading) &&
              layerWithStyle.style !== layerWithStyle.defaultStyle &&
              this.styles.has(layerWithStyle.style as never)))
        );
      })
      .map((l) => {
        const layerWithStyle = l as typeof l & {
          style?: { name: string; [moduleIdSymbol]?: string };
          defaultStyle?: { name: string };
        };

        const layerState: LayerState = {
          name: l.name,
          active: l.active || l.loading,
        };
        if (
          layerWithStyle.style &&
          layerWithStyle.defaultStyle &&
          layerWithStyle.style.name !== layerWithStyle.defaultStyle.name &&
          this.styles.has(layerWithStyle.style as never) &&
          layerWithStyle.style[moduleIdSymbol] !== defaultDynamicModuleId &&
          layerWithStyle.style[moduleIdSymbol] !== volatileModuleId
        ) {
          layerState.styleName = layerWithStyle.style.name;
        } else if (l instanceof WMSLayer) {
          const module = this.getModuleById(l[moduleIdSymbol]!);
          const styleName = writeWMSStyleForLayer(l, module?.config);
          if (styleName) {
            layerState.styleName = styleName;
          }
        }
        return layerState;
      });

    state.clippingPolygons = [...this.clippingPolygons]
      .filter(
        (p) =>
          p[moduleIdSymbol] !== defaultDynamicModuleId &&
          p[moduleIdSymbol] !== volatileModuleId &&
          ((p.active && !p.activeOnStartup) ||
            (!p.active && p.activeOnStartup)),
      )
      .map((p) => ({ name: p.name, active: p.active }));

    const plugins: Array<PluginState<unknown> | null> = await Promise.all(
      [...this.plugins]
        .filter(
          (p) =>
            p[moduleIdSymbol] !== defaultDynamicModuleId &&
            p[moduleIdSymbol] !== volatileModuleId &&
            typeof p.getState === 'function',
        )
        .map(async (p): Promise<PluginState<unknown> | null> => {
          try {
            if (!p.getState) {
              return null;
            }

            const pluginState = await p.getState(forUrl);
            if (pluginState && Object.keys(pluginState).length > 0) {
              return { name: p.name, state: pluginState };
            }
            return null;
          } catch (e: unknown) {
            getLogger().error(getCaughtError(e).message);
            return null;
          }
        }),
    );

    state.plugins = plugins.filter(
      (p): p is PluginState<unknown> => p !== null,
    );

    if (activeMap instanceof ObliqueMap && activeMap.collection) {
      state.activeObliqueCollection = activeMap.collection.name;
    }
    return state;
  }

  protected async _parseModule(module: VcsModule): Promise<void> {
    const config = module.config as VcsUiModuleConfig;
    if (!config._id) {
      getLogger().warning(
        'A module is missing a stable _id property. This may lead to issues while restoring application state.',
      );
    }
    if (Array.isArray(config.plugins)) {
      await this._plugins.parseItems(config.plugins, module._id);
    }
    if (Array.isArray(config.i18n)) {
      await this._i18n.parseItems(config.i18n, module._id);
    }
    await super._parseModule(module);
    await this._contentTree.parseItems(config.contentTree, module._id);
    await this._uiConfig.parseItems(config.uiConfig, module._id);
    await this._featureInfo.parseItems(config.featureInfo, module._id);
  }

  protected async _setModuleState(module: VcsModule): Promise<void> {
    await super._setModuleState(module);
    if (this._cachedAppState.moduleIds.includes(module._id)) {
      this._cachedAppState.layers.forEach((layerState: LayerState) => {
        const layer = this.layers.getByKey(layerState.name);
        if (layer) {
          const layerWithStyle = layer as typeof layer & {
            setStyle?: (style: unknown) => void;
          };
          if (layerState.active) {
            layer.activate().catch((e: unknown) => {
              getLogger().warning(
                'Failed to activate cached app state. layer failed: ',
                layer.name,
                e,
              );
            });
          } else {
            layer.deactivate();
          }

          if (layerState.styleName) {
            if (
              this.styles.hasKey(layerState.styleName) &&
              layerWithStyle.setStyle
            ) {
              layerWithStyle.setStyle(
                this.styles.getByKey(layerState.styleName),
              );
            } else if (layer instanceof WMSLayer) {
              const { layers, styles } = parseWMSStyle(layerState.styleName);
              if (styles) {
                layer.parameters.STYLES = styles;
              }
              layer
                .setLayers(layers || layer.getLayers())
                .catch((err: unknown) => {
                  getLogger().warning(
                    `Failed to set WMS layers ${layers} on layer ${layer.name}`,
                    err,
                  );
                });
            }
          }
        }
      });
      if (
        this._cachedAppState.activeMap &&
        this.maps.hasKey(this._cachedAppState.activeMap)
      ) {
        await this.maps.setActiveMap(this._cachedAppState.activeMap);
      }
      if (
        this._cachedAppState.activeObliqueCollection &&
        this.maps.activeMap instanceof ObliqueMap &&
        this.obliqueCollections.hasKey(
          this._cachedAppState.activeObliqueCollection,
        )
      ) {
        const obliqueCollection = this.obliqueCollections.getByKey(
          this._cachedAppState.activeObliqueCollection,
        );
        await this.maps.activeMap.setCollection(
          obliqueCollection as NonNullable<typeof obliqueCollection>,
        );
      }
      const viewpointOptions =
        this._cachedAppState.activeViewpoint ??
        this._cachedAppState.getViewpoint?.(module._id);
      if (viewpointOptions) {
        await this.maps.activeMap?.gotoViewpoint(
          new Viewpoint(viewpointOptions),
        );
      }
      this._cachedAppState.clippingPolygons.forEach(
        (cpState: ClippingPolygonState) => {
          const clippingPolygon = this.clippingPolygons.getByKey(cpState.name);
          if (clippingPolygon) {
            if (cpState.active) {
              clippingPolygon.activate();
            } else {
              clippingPolygon.deactivate();
            }
          }
        },
      );
      this._cachedAppState.moduleIds.splice(
        this._cachedAppState.moduleIds.indexOf(module._id),
        1,
      );
    }
  }

  serializeModule(moduleId: string): VcsUiModuleConfig {
    const config = super.serializeModule(moduleId) as VcsUiModuleConfig;
    config.uiConfig = this._uiConfig.serializeModule(moduleId);
    config.featureInfo = this._featureInfo.serializeModule(moduleId);
    config.i18n = this._i18n.serializeModule(moduleId);
    config.contentTree = this._contentTree.serializeModule(moduleId);
    config.plugins = this._plugins.serializeModule(moduleId);
    return config;
  }

  protected async _removeModule(moduleId: string): Promise<void> {
    await super._removeModule(moduleId);
    this._plugins.removeModule(moduleId);
    this._i18n.removeModule(moduleId);
    this._contentTree.removeModule(moduleId);
    this._featureInfo.removeModule(moduleId);
    this._uiConfig.removeModule(moduleId);
  }

  /**
   * Destroys the vcsUiApp and all its collections, their content and ui managers.
   */
  destroy(): void {
    this.windowManager.destroy();
    this.panelManager.destroy();
    this.navbarManager.destroy();
    this.toolboxManager.destroy();
    this.categoryManager.destroy();
    this.contextMenuManager.destroy();
    this._overviewMap.destroy();
    this._pluginListeners.forEach((cb: () => void) => {
      cb();
    });
    this._pluginListeners = [];
    destroyCollection(this._plugins);
    destroyCollection(this._contentTree);
    this._i18n.destroy();
    destroyCollection(this._search);
    this._vueI18nDestroy();
    this._contentTreeClassRegistry.destroy();
    this._featureInfoClassRegistry.destroy();
    this._featureInfo.destroy();
    this._uiConfig.destroy();
    this._destroySiteConfig();
    this._destroyObliqueFallback();
    super.destroy();
  }
}

export default VcsUiApp;
