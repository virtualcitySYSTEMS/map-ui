import {
  VcsApp,
  contextIdSymbol,
  Collection,
  makeOverrideCollection,
  destroyCollection,
  OverrideClassRegistry,
} from '@vcmap/core';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import {
  isValidPackageName,
  loadPlugin,
  serializePlugin,
  deserializePlugin,
} from './pluginHelper.js';
import { setupDefaultGroups, ToolboxManager } from './manager/toolbox/toolboxManager.js';
import { WindowManager } from './manager/window/windowManager.js';
import { NavbarManager } from './manager/navbarManager.js';
import { createContentTreeCollection } from './contentTree/contentTreeCollection.js';
import { contentTreeClassRegistry } from './contentTree/contentTreeItem.js';
import OverviewMap from './navigation/overviewMap.js';
import I18nCollection from './i18n/i18nCollection.js';
import CategoryManager from './manager/categoryManager/categoryManager.js';
import ContextMenuManager from './manager/contextMenu/contextMenuManager.js';
import FeatureInfo from './featureInfo/featureInfo.js';
import UiConfig from './uiConfig.js';

/**
 * @typedef {import("@vcmap/core").VcsAppConfig} VcsUiAppConfig
 * @property {Array<Object>} [plugins]
 * @property {Array<ContentTreeItemOptions>} [contentTree]
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
 * @returns {VcsPlugin<P>}
 */

/**
 * @interface VcsPlugin
 * @template {Object} P
 * @property {string} version
 * @property {string} name
 * @property {Object<string, *>} [i18n] - the i18n messages of this plugin
 * @property {function(VcsUiApp)} initialize - called on plugin added
 * @property {function(VcsUiApp)} onVcsAppMounted - called on mounted of VcsApp.vue
 * @property {function():P} [toJSON] - serialization
 * @property {function():Promise<void>} destroy
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
  constructor() {
    super();
    /**
     * @type {import("@vcmap/core").OverrideCollection<VcsPlugin>}
     * @private
     */
    this._plugins = makeOverrideCollection(
      new Collection(),
      () => this.dynamicContextId,
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
        if (plugin.i18n) {
          this.i18n.addPluginMessages(plugin.name, plugin[contextIdSymbol], plugin.i18n);
        }
        if (plugin.initialize) {
          plugin.initialize(this);
        }
      }),
      this._plugins.removed.addEventListener(async (plugin) => {
        this._windowManager.removeOwner(plugin.name);
        this._navbarManager.removeOwner(plugin.name);
        this._toolboxManager.removeOwner(plugin.name);
        this._categoryManager.removeOwner(plugin.name);
        this._contextMenuManager.removeOwner(plugin.name);
        this.i18n.removePluginMessages(plugin.name, plugin[contextIdSymbol]);
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
    this._uiConfig = new UiConfig(() => this.dynamicContextId);
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
    this._i18n = new I18nCollection(() => this.dynamicContextId);

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
   * @type {UiConfig}
   * @readonly
   */
  get uiConfig() { return this._uiConfig; }

  /**
   * @param {import("@vcmap/core").Context} context
   * @returns {Promise<void>}
   * @protected
   */
  async _parseContext(context) {
    const { config } = context;
    if (Array.isArray(config.plugins)) {
      const plugins = await Promise.all(config.plugins.map(async (pluginConfig) => {
        const plugin = await loadPlugin(this, pluginConfig.name, pluginConfig);
        if (!plugin) {
          return null;
        }
        if (!isValidPackageName(plugin.name)) {
          getLogger().warning(`plugin ${plugin.name} has no valid package name!`);
        }
        plugin[contextIdSymbol] = context.id;
        return plugin;
      }));

      plugins
        .filter(p => p)
        .map(p => this._plugins.override(p));
    }
    if (Array.isArray(config.i18n)) {
      await this.i18n.parseItems(config.i18n, context.id);
    }
    await super._parseContext(context);
    await this._contentTree.parseItems(config.contentTree, context.id);
    await this._uiConfig.parseItems(config.uiConfig, context.id);
    await this._featureInfo.parseContext(config.featureInfo, context.id);
  }

  /**
   * @param {string} contextId
   * @returns {Promise<void>}
   * @protected
   */
  async _removeContext(contextId) {
    await Promise.all([
      super._removeContext(contextId),
      this._plugins.removeContext(contextId),
      this._i18n.removeContext(contextId),
      this._contentTree.removeContext(contextId),
      this._featureInfo.removeContext(contextId),
      this._uiConfig.removeContext(contextId),
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
    this._contentTreeClassRegistry.destroy();
    this._featureInfo.destroy();
    this._uiConfig.destroy();
    super.destroy();
  }
}

export default VcsUiApp;
