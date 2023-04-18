import {
  VcsApp,
  moduleIdSymbol,
  Collection,
  makeOverrideCollection,
  destroyCollection,
  OverrideClassRegistry,
  defaultDynamicModuleId,
  ObliqueMap,
  Viewpoint,
  volatileModuleId,
  VcsEvent,
} from '@vcmap/core';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import {
  isValidPackageName,
  loadPlugin,
  serializePlugin,
  deserializePlugin,
} from './pluginHelper.js';
import ToolboxManager, { setupDefaultGroups } from './manager/toolbox/toolboxManager.js';
import WindowManager from './manager/window/windowManager.js';
import NavbarManager from './manager/navbarManager.js';
import { createContentTreeCollection } from './contentTree/contentTreeCollection.js';
import { contentTreeClassRegistry } from './contentTree/contentTreeItem.js';
import OverviewMap from './navigation/overviewMap.js';
import I18nCollection from './i18n/i18nCollection.js';
import CategoryManager from './manager/categoryManager/categoryManager.js';
import ContextMenuManager from './manager/contextMenu/contextMenuManager.js';
import FeatureInfo from './featureInfo/featureInfo.js';
import UiConfig from './uiConfig.js';
import { createEmptyState, getStateFromURL } from './state.js';
import { version } from '../package.json';
import Search from './search/search.js';
import Notifier from './notifier/notifier.js';

/**
 * @typedef {import("@vcmap/core").VcsAppConfig} VcsUiAppConfig
 * @property {Array<Object>} [plugins]
 * @property {Array<ContentTreeItemOptions>} [contentTree]
 * @property {Array<UiConfigurationItem>} [uiConfig]
 * @property {Array<FeatureInfoViewOptions>} [featureInfo]
 * @property {Array<Object>} [i18n]
 */

/**
 * @typedef {Object} PluginConfig
 * @property {string} name
 * @property {string|undefined} entry
 * @property {string|undefined} version
 */

/**
 * @callback createPlugin
 * @template {Object} P
 * @param {P} config
 * @param {string} pluginBaseUrl
 * @returns {VcsPlugin<P>}
 */

/**
 * @interface VcsPlugin
 * @template {Object} P
 * @template {Object} S
 * @property {string} version
 * @property {string} name
 * @property {Object<string, *>} [i18n] - the i18n messages of this plugin
 * @property {function(VcsUiApp, S=)} initialize - called on plugin added. Is passed the VcsUiApp and optionally, the state for the plugin
 * @property {function(VcsUiApp)} onVcsAppMounted - called on mounted of VcsApp.vue
 * @property {function():P} [toJSON] - serialization
 * @property {function():Promise<void>} destroy
 * @property {function(boolean=):S|Promise<S>} [getState] - should return the plugins state or a promise for said state. is passed a "for url" flag. If true, only the state relevant for sharing a URL should be passed and short keys shall be used
 * @api
 */


/**
 * @interface VcsComponentManager
 * @template {Object} T - the component type
 * @template {Object} O - component options
 * @property {import("@vcmap/core").VcsEvent<T>} added
 * @property {import("@vcmap/core").VcsEvent<T>} removed
 * @property {string[]} componentIds - all registered component ids as reactive array
 * @property {function(string):T} get - get component by id
 * @property {function(string):boolean} has - has component with id
 * @property {function(string)} remove - remove component by id
 * @property {function(O, string|vcsAppSymbol):T} add - add component of owner
 * @property {function(string|vcsAppSymbol)} removeOwner - remove all components of owner
 * @property {function()} clear - remove all registered components
 * @property {function()} destroy
 * @api
 */

/**
 * @returns {Logger}
 */
function getLogger() {
  return getLoggerByName('VcsUiApp');
}

/**
 * @class
 */
class VcsUiApp extends VcsApp {
  /**
   * Gets the version of the @vcmap/ui npm package
   * @returns {string}
   */
  static getVersion() { return version; }

  constructor() {
    super();
    /**
     * An event triggered when the vuetify theme mode changes or the primary color is updated by a new uiConfig entry.
     * @type {VcsEvent<void>}
     */
    this.themeChanged = new VcsEvent();
    /**
     * @type {import("@vcmap/core").OverrideCollection<VcsPlugin>}
     * @private
     */
    this._plugins = makeOverrideCollection(
      new Collection(),
      () => this.dynamicModuleId,
      serializePlugin,
      deserializePlugin,
    );
    /**
     * @type {Array<function():void>}
     * @private
     */
    this._pluginListeners = [
      this._plugins.added.addEventListener((plugin) => {
        this._windowManager.removeOwner(plugin.name);
        this._navbarManager.removeOwner(plugin.name);
        this._toolboxManager.removeOwner(plugin.name);
        this._categoryManager.removeOwner(plugin.name);
        this._contextMenuManager.removeOwner(plugin.name);
        this._search.removeOwner(plugin.name);
        if (plugin.i18n) {
          this.i18n.addPluginMessages(plugin.name, plugin[moduleIdSymbol], plugin.i18n);
        }
        if (plugin.initialize) {
          let state;
          if (this._cachedAppState.moduleIds.includes(plugin[moduleIdSymbol])) {
            state = this._cachedAppState.plugins.find(s => s.name === plugin.name);
          }
          try {
            plugin.initialize(this, state?.state);
          } catch (e) {
            getLogger().error(`Error in plugin ${plugin.name} initialize hook`, e);
          }
        }
      }),
      this._plugins.removed.addEventListener(async (plugin) => {
        this._windowManager.removeOwner(plugin.name);
        this._navbarManager.removeOwner(plugin.name);
        this._toolboxManager.removeOwner(plugin.name);
        this._categoryManager.removeOwner(plugin.name);
        this._contextMenuManager.removeOwner(plugin.name);
        this._search.removeOwner(plugin.name);
        this.i18n.removePluginMessages(plugin.name, plugin[moduleIdSymbol]);
      }),
    ];

    /**
     * @type {OverrideClassRegistry<ContentTreeItem>}
     * @private
     */
    this._contentTreeClassRegistry = new OverrideClassRegistry(contentTreeClassRegistry);

    /**
     * @type {OverrideContentTreeCollection}
     * @private
     */
    this._contentTree = createContentTreeCollection(this);

    /**
     * @type {ToolboxManager}
     * @private
     */
    this._toolboxManager = new ToolboxManager();
    setupDefaultGroups(this._toolboxManager);

    /**
     * @type {WindowManager}
     * @private
     */
    this._windowManager = new WindowManager();
    /**
     * @type {NavbarManager}
     * @private
     */
    this._navbarManager = new NavbarManager();
    /**
     * @type {UiConfig}
     * @private
     */
    this._uiConfig = new UiConfig(() => this.dynamicModuleId);
    /**
     * @type {FeatureInfo}
     * @private
     */
    this._featureInfo = new FeatureInfo(this);

    /**
     * @type {OverviewMap}
     * @private
     */
    this._overviewMap = new OverviewMap(this);

    /**
     * @type {I18nCollection<Object>}
     * @private
     */
    this._i18n = new I18nCollection(() => this.dynamicModuleId);

    /**
     * @type {CategoryManager}
     * @private
     */
    this._categoryManager = new CategoryManager(this);

    /**
     * @type {ContextMenuManager}
     * @private
     */
    this._contextMenuManager = new ContextMenuManager(this);

    /**
     * @type {Search}
     * @private
     */
    this._search = new Search(this);

    /**
     * @type {Notifier}
     * @private
     */
    this._notifier = new Notifier();

    /**
     * @type {AppState}
     * @private
     */
    this._cachedAppState = getStateFromURL(new URL(window.location.href));
    /**
     * An event triggered when the VcsApp was mounted and a target was set for the maps.
     * Provides the id of the target html element.
     * @type {import("@vcmap/core").VcsEvent<string>}
     */
    this.mounted = new VcsEvent();
  }

  /**
   * @type {import("@vcmap/core").OverrideCollection<VcsPlugin>}
   * @readonly
   */
  get plugins() { return this._plugins; }

  /**
   * @type {OverrideContentTreeCollection}
   * @readonly
   */
  get contentTree() { return this._contentTree; }

  /**
   * @type {OverrideClassRegistry<ContentTreeItem>}
   * @readonly
   */
  get contentTreeClassRegistry() { return this._contentTreeClassRegistry; }

  /**
   * @returns {ToolboxManager}
   * @readonly
   */
  get toolboxManager() { return this._toolboxManager; }

  /**
   * @returns {WindowManager}
   * @readonly
   */
  get windowManager() { return this._windowManager; }

  /**
   * @returns {NavbarManager}
   * @readonly
   */
  get navbarManager() { return this._navbarManager; }

  /**
   * @returns {FeatureInfo}
   * @readonly
   */
  get featureInfo() { return this._featureInfo; }

  /**
   * @type {OverviewMap}
   * @readonly
   */
  get overviewMap() { return this._overviewMap; }

  /**
   * @type {I18nCollection}
   * @readonly
   */
  get i18n() { return this._i18n; }

  /**
   * @returns {CategoryManager}
   * @readonly
   */
  get categoryManager() { return this._categoryManager; }

  /**
   * @type {ContextMenuManager}
   * @readonly
   */
  get contextMenuManager() { return this._contextMenuManager; }

  /**
   * @type {Search}
   * @readonly
   */
  get search() { return this._search; }

  /**
   * @type {UiConfig}
   * @readonly
   */
  get uiConfig() { return this._uiConfig; }

  /**
   * @type {Notifier}
   * @readonly
   */
  get notifier() { return this._notifier; }

  /**
   * Get the state of the application. When passed the forUrl flag, only a minimal set of states shall be provided for a sharable link to the current state (to ensure
   * the maximum URL length is not exceeded). This includes: layer active state & styling, active map, active viewpoint,
   * currently selected feature info & any state deemed required for a sharable URL by the currently loaded plugins.
   * @param {boolean=} forUrl
   * @returns {Promise<AppState>}
   */
  async getState(forUrl) {
    const state = createEmptyState();
    state.moduleIds = this.modules
      .filter(({ _id }) => _id !== defaultDynamicModuleId)
      .map(({ _id }) => _id);

    state.activeMap = this.maps.activeMap.name;
    const viewpoint = await this.maps.activeMap.getViewpoint();
    state.activeViewpoint = viewpoint?.isValid?.() ? viewpoint.toJSON() : undefined;
    state.layers = [...this.layers]
      .filter(l => l.isSupported(this.maps.activeMap) &&
        l[moduleIdSymbol] !== defaultDynamicModuleId &&
        l[moduleIdSymbol] !== volatileModuleId &&
        (
          ((l.active || l.loading) && !l.activeOnStartup) ||
          (!l.active && l.activeOnStartup) ||
          ((l.active || l.loading) && l.style !== l.defaultStyle && this.styles.has(l.style))
        ))
      .map((l) => {
        const layerState = {
          name: l.name,
          active: l.active || l.loading,
        };
        if (
          l.style &&
          l.style.name !== l.defaultStyle.name &&
          this.styles.has(l.style) &&
          l.style[moduleIdSymbol] !== defaultDynamicModuleId &&
          l.style[moduleIdSymbol] !== volatileModuleId
        ) {
          layerState.styleName = l.style.name;
        }
        return layerState;
      });

    state.plugins = await Promise.all([...this.plugins]
      .filter(p => p[moduleIdSymbol] !== defaultDynamicModuleId &&
        p[moduleIdSymbol] !== volatileModuleId &&
        typeof p.getState === 'function')
      .map(async p => ({ name: p.name, state: await p.getState(forUrl) })));

    if (this.maps.activeMap instanceof ObliqueMap) {
      state.activeObliqueCollection = this.maps.activeMap.collection.name;
    }
    return state;
  }

  /**
   * @param {import("@vcmap/core").VcsModule} module
   * @returns {Promise<void>}
   * @protected
   */
  async _parseModule(module) {
    const { config } = module;
    if (Array.isArray(config.plugins)) {
      const plugins = await Promise.all(config.plugins.map(async (pluginConfig) => {
        const plugin = await loadPlugin(pluginConfig.name, pluginConfig);
        if (!plugin) {
          return null;
        }
        if (!isValidPackageName(plugin.name)) {
          getLogger().warning(`plugin ${plugin.name} has no valid package name!`);
        }
        plugin[moduleIdSymbol] = module._id;
        return plugin;
      }));

      plugins
        .filter(p => p)
        .map(p => this._plugins.override(p));
    }
    if (Array.isArray(config.i18n)) {
      await this.i18n.parseItems(config.i18n, module._id);
    }
    await super._parseModule(module);
    await this._contentTree.parseItems(config.contentTree, module._id);
    await this._uiConfig.parseItems(config.uiConfig, module._id);
    await this._featureInfo.collection.parseItems(config.featureInfo, module._id);
  }

  /**
   * @param {import("@vcmap/core").VcsModule} module
   * @returns {Promise<void>}
   * @protected
   */
  async _setModuleState(module) {
    await super._setModuleState(module);
    if (this._cachedAppState.moduleIds.includes(module._id)) {
      this._cachedAppState.layers.forEach((layerState) => {
        const layer = this.layers.getByKey(layerState.name);
        if (layer) {
          if (layerState.active) {
            layer.activate();
          } else {
            layer.deactivate();
          }

          if (layerState.styleName && this.styles.hasKey(layerState.styleName) && layer.setStyle) {
            layer.setStyle(this.styles.getByKey(layerState.styleName));
          }
        }
      });
      if (this._cachedAppState.activeMap && this.maps.hasKey(this._cachedAppState.activeMap)) {
        await this.maps.setActiveMap(this._cachedAppState.activeMap);
      }
      if (
        this._cachedAppState.activeObliqueCollection &&
        this.maps.activeMap instanceof ObliqueMap &&
        this.obliqueCollections.hasKey(this._cachedAppState.activeObliqueCollection)
      ) {
        await this.maps.activeMap.setCollection(
          this.obliqueCollections.getByKey(this._cachedAppState.activeObliqueCollection),
          this._cachedAppState.activeViewpoint,
        );
      } else if (this._cachedAppState.activeViewpoint && this.maps.activeMap) {
        await this.maps.activeMap.gotoViewpoint(new Viewpoint(this._cachedAppState.activeViewpoint));
      }
      this._cachedAppState.moduleIds.splice(this._cachedAppState.moduleIds.indexOf(module._id), 1);
    }
  }

  /**
   * @param {string} moduleId
   * @returns {Promise<void>}
   * @protected
   */
  async _removeModule(moduleId) {
    await Promise.all([
      super._removeModule(moduleId),
      this._plugins.removeModule(moduleId),
      this._i18n.removeModule(moduleId),
      this._contentTree.removeModule(moduleId),
      this._featureInfo.collection.removeModule(moduleId),
      this._uiConfig.removeModule(moduleId),
    ]);
  }

  /**
   * Destroys the vcsUiApp and all its collections, their content and ui managers.
   */
  destroy() {
    this.windowManager.destroy();
    this.navbarManager.destroy();
    this.toolboxManager.destroy();
    this.categoryManager.destroy();
    this.contextMenuManager.destroy();
    this._overviewMap.destroy();
    this._pluginListeners.forEach((cb) => { cb(); });
    this._pluginListeners = [];
    destroyCollection(this._plugins);
    destroyCollection(this._contentTree);
    destroyCollection(this._i18n);
    destroyCollection(this._search);
    this._contentTreeClassRegistry.destroy();
    this._featureInfo.destroy();
    this._uiConfig.destroy();
    super.destroy();
  }
}

export default VcsUiApp;
