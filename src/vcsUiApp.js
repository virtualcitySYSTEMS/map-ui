import { VcsApp, contextIdSymbol, Collection, makeOverrideCollection, destroyCollection } from '@vcmap/core';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import {
  isValidPackageName,
  loadPlugin,
  serializePlugin,
  deserializePlugin,
} from './pluginHelper.js';
import { ToolboxManager } from './manager/toolbox/toolbox-manager.js';
import { WindowManager } from './manager/window/windowManager.js';
import ButtonManager from './manager/buttonManager.js';
import { createContentTreeCollection } from './contentTree/contentTreeCollection.js';

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
 * @property {VcsEvent<T>} added
 * @property {VcsEvent<T>} removed
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
     * @type {OverrideCollection<VcsPlugin>}
     * @private
     */
    this._plugins = makeOverrideCollection(
      new Collection(),
      () => this.dynamicContextId,
      serializePlugin,
      deserializePlugin,
    );
    this._pluginAddedListener = this._plugins.added.addEventListener((plugin) => {
      if (plugin.initialize) {
        plugin.initialize(this);
      }
    });

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

    /**
     * @type {WindowManager}
     * @private
     */
    this._windowManager = new WindowManager();
    /**
     * @type {ButtonManager}
     * @private
     */
    this._navbarManager = new ButtonManager();
  }

  /**
   * @type {OverrideCollection<VcsPlugin>}
   * @readonly
   */
  get plugins() { return this._plugins; }

  /**
   * @returns {OverrideCollection<AbstractTreeViewItem>}
   */
  get contentTree() { return this._contentTree; }

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
   * @returns {ButtonManager}
   * @readonly
   */
  get navbarManager() { return this._navbarManager; }

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
        .map(p => this._plugins.override(p))
        .filter(p => p);
    }
    await super._parseContext(context);
    await this._contentTree.parseItems(config.contentTree, context.id);
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
      this._contentTree.removeContext(contextId),
    ]);
  }

  /**
   * Destroys the vcsUiApp and all its collections, their content and ui managers.
   */
  destroy() {
    this.windowManager.destroy();
    this.navbarManager.destroy();
    // TODO destroy other manager
    this._pluginAddedListener();
    destroyCollection(this._plugins);
    destroyCollection(this._contentTree);
    super.destroy();
  }
}

export default VcsUiApp;
