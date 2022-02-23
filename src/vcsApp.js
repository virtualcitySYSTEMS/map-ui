import {
  Collection,
  IndexedCollection,
  Layer,
  MapCollection, ObliqueCollection,
  setDefaultProjectionOptions,
  StyleItem,
  VcsEvent,
  VcsMap,
  ViewPoint,
} from '@vcmap/core';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import { v4 as uuidv4 } from 'uuid';
import { check } from '@vcsuite/check';
import Context from './context.js';
import {
  contextIdSymbol,
  loadPlugin,
  destroyCollection,
  getObjectFromOptions,
  serializePlugin,
  deserializePlugin,
  deserializeViewPoint,
  deserializeMap,
  getLayerIndex,
  serializeLayer,
} from './vcsAppContextHelpers.js';
import makeOverrideCollection from './overrideCollection.js';
import CategoryCollection from './CategoryCollection.js';
import { isValidPackageName } from './pluginHelper.js';
import { ToolboxManager } from './modules/toolbox-manager/toolbox-manager.js';
import { PopoverManager } from './modules/popover-manager/popover.manager.js';
import { WindowManager } from './modules/window-manager/windowManager.js';
import ButtonManager from './modules/component-manager/buttonManager.js';

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
 * @property {function(VcsApp)} initialize - called on plugin added
 * @property {function(VcsApp)} onVcsAppMounted - called on mounted of VcsApp.vue
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
  return getLoggerByName('init');
}

/**
 * @type {Map<string, VcsApp>}
 */
const vcsApps = new Map();

/**
 * @class
 */
class VcsApp {
  constructor() {
    /**
     * @type {string}
     * @private
     */
    this._id = uuidv4();
    /**
     * @type {Context}
     * @private
     */
    this._defaultDynamicContext = new Context({ id: '_defaultDynamicContext' });
    /**
     * @type {Context}
     * @private
     */
    this._dynamicContext = this._defaultDynamicContext;

    const getDynamicContextId = () => this._dynamicContext.id;
    /**
     * @type {OverrideMapCollection}
     * @private
     */
    this._maps = makeOverrideCollection(
      new MapCollection(),
      getDynamicContextId,
      null,
      deserializeMap.bind(null, this),
      VcsMap,
    );
    /**
     * @type {OverrideLayerCollection}
     * @private
     */
    this._layers = makeOverrideCollection(
      this._maps.layerCollection,
      getDynamicContextId,
      serializeLayer.bind(null, this),
      getObjectFromOptions,
      Layer,
      getLayerIndex,
    );
    /**
     * @type {OverrideCollection<import("@vcmap/core").ObliqueCollection>}
     * @private
     */
    this._obliqueCollections = makeOverrideCollection(
      new Collection(),
      getDynamicContextId,
      null,
      getObjectFromOptions,
      ObliqueCollection,
    ); // XXX there is a global for this collection in core.
    /**
     * @type {OverrideCollection<import("@vcmap/core").ViewPoint>}
     * @private
     */
    this._viewPoints = makeOverrideCollection(
      new Collection(),
      getDynamicContextId,
      null,
      deserializeViewPoint,
      ViewPoint,
    );
    /**
     * @type {OverrideCollection<import("@vcmap/core").StyleItem>}
     * @private
     */
    this._styles = makeOverrideCollection(
      new Collection(),
      getDynamicContextId,
      null,
      getObjectFromOptions,
      StyleItem,
    ); // XXX there is a global for this collection in core.
    /**
     * @type {OverrideCollection<VcsPlugin>}
     * @private
     */
    this._plugins = makeOverrideCollection(
      new Collection(),
      getDynamicContextId,
      serializePlugin,
      deserializePlugin,
    );
    this._pluginAddedListener = this._plugins.added.addEventListener((plugin) => {
      if (plugin.initialize) {
        plugin.initialize(this);
      }
    });
    /**
     * @type {import("@vcmap/core").IndexedCollection<Context>}
     * @private
     */
    this._contexts = new IndexedCollection('id');
    this._contexts.add(this._dynamicContext);
    /**
     * @type {CategoryCollection}
     * @private
     */
    this._categories = new CategoryCollection(this);
    /**
     * @type {import("@vcmap/core").VcsEvent<void>}
     * @private
     */
    this._destroyed = new VcsEvent();
    /**
     * @type {Promise<void>}
     * @private
     */
    this._contextMutationPromise = Promise.resolve();
    vcsApps.set(this._id, this);

    /**
     * @type {ToolboxManager}
     * @private
     */
    this._toolboxManager = new ToolboxManager();
    /**
     * @type {PopoverManager}
     * @private
     */
    this._popoverManager = new PopoverManager();
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
   * @type {string}
   * @readonly
   */
  get id() { return this._id; }

  /**
   * @type {OverrideMapCollection}
   * @readonly
   */
  get maps() { return this._maps; }

  /**
   * @type {OverrideLayerCollection}
   * @readonly
   */
  get layers() { return this._layers; }

  /**
   * @type {OverrideCollection<import("@vcmap/core").ObliqueCollection>}
   * @readonly
   */
  get obliqueCollections() { return this._obliqueCollections; }

  /**
   * @type {OverrideCollection<import("@vcmap/core").ViewPoint>}
   * @readonly
   */
  get viewPoints() { return this._viewPoints; }

  /**
   * @type {OverrideCollection<import("@vcmap/core").StyleItem>}
   * @readonly
   */
  get styles() { return this._styles; }

  /**
   * @type {OverrideCollection<VcsPlugin>}
   * @readonly
   */
  get plugins() { return this._plugins; }

  /**
   * @type {CategoryCollection}
   * @readonly
   */
  get categories() { return this._categories; }

  /**
   * @type {import("@vcmap/core").VcsEvent<void>}
   * @readonly
   */
  get destroyed() { return this._destroyed; }

  /**
   * @returns {ToolboxManager}
   * @readonly
   */
  get toolboxManager() { return this._toolboxManager; }

  /**
   * @returns {PopoverManager}
   * @readonly
   */
  get popoverManager() { return this._popoverManager; }

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
   * @returns {VcsEvent<Context>}
   * @readonly
   */
  get contextAdded() { return this._contexts.added; }

  /**
   * @returns {VcsEvent<Context>}
   * @readonly
   */
  get contextRemoved() { return this._contexts.removed; }

  get dynamicContextId() { return this._dynamicContext.id; }

  /**
   * @param {string} id
   * @returns {Context}
   */
  getContextById(id) {
    return this._contexts.getByKey(id);
  }

  /**
   * @param {Context} context
   * @returns {Promise<void>}
   * @private
   */
  async _addContext(context) {
    check(context, Context);

    if (this._contexts.has(context.id)) {
      getLogger().info(`context with id ${context.id} already loaded`);
      return;
    }

    const { config } = context;
    let plugins = [];
    if (Array.isArray(config.plugins)) {
      plugins = await Promise.all(config.plugins.map(async (pluginConfig) => {
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

      plugins = plugins
        .filter(p => p)
        .map(p => this._plugins.override(p))
        .filter(p => p);
    }

    if (config.projection) { // XXX this needs fixing. this should be _projections_ and there should be a `defaultProjection`
      setDefaultProjectionOptions(config.projection);
    }

    await this._styles.parseItems(config.styles, context.id);
    await this._layers.parseItems(config.layers, context.id);
    // TODO add flights & ade here

    [...this._layers]
      .filter(l => l[contextIdSymbol] === context.id)
      .forEach((l) => {
        if (l.activeOnStartup) {
          l.activate()
            .catch((err) => {
              getLogger().error(`Failed to activate active on startup layer ${l.name}`);
              getLogger().error(err);
              this._layers.remove(l);
              l.destroy();
            });
        }
      });

    await this._obliqueCollections.parseItems(config.obliqueCollections, context.id);
    await this._viewPoints.parseItems(config.viewpoints, context.id);
    await this._maps.parseItems(config.maps, context.id);

    if (config.startingMapName) {
      await this._maps.setActiveMap(config.startingMapName);
    } else if (!this._maps.activeMap && this._maps.size > 0) {
      await this._maps.setActiveMap([...this._maps][0].name);
    }

    if (config.startingViewPointName && this._maps.activeMap) {
      const startViewPoint = this._viewPoints.getByKey(config.startingViewPointName);
      if (startViewPoint) {
        await this._maps.activeMap.gotoViewPoint(startViewPoint);
      }
    }

    if (Array.isArray(config.categories)) {
      await Promise.all((config.categories).map(async ({ name, items }) => {
        await this._categories.parseCategoryItems(name, items, context.id);
      }));
    }

    const postInitPromises = plugins
      .filter(p => p[contextIdSymbol] === context.id)
      .map(async (plugin) => {
        if (plugin.postInitialize) {
          await plugin.postInitialize();
        }
      });

    await Promise.all(postInitPromises);

    this._contexts.add(context);
  }

  /**
   * @param {Context} context
   * @returns {Promise<void>}
   */
  addContext(context) {
    this._contextMutationPromise = this._contextMutationPromise
      .then(() => {
        return this._addContext(context);
      });
    return this._contextMutationPromise;
  }

  /**
   * @param {string} contextId
   * @returns {Promise<void>}
   * @private
   */
  async _removeContext(contextId) {
    const context = this._contexts.getByKey(contextId);
    if (!context) {
      throw new Error(`Could not find context with id ${contextId}`);
    }


    await Promise.all([
      this._maps.removeContext(contextId),
      this._layers.removeContext(contextId),
      this._viewPoints.removeContext(contextId),
      this._styles.removeContext(contextId),
      this._obliqueCollections.removeContext(contextId),
      this._plugins.removeContext(contextId),
    ]);

    this._contexts.remove(context);
  }

  /**
   * @param {string} contextId
   * @returns {Promise<void>}
   */
  removeContext(contextId) {
    this._contextMutationPromise = this._contextMutationPromise
      .then(() => {
        return this._removeContext(contextId);
      });
    return this._contextMutationPromise;
  }

  destroy() {
    Object.defineProperty(this, '_contextMutationPromise', {
      get() {
        throw new Error('VcsApp was destroyed');
      },
    });
    this.windowManager.destroy();
    this.navbarManager.destroy();
    // TODO destroy other manager
    this._pluginAddedListener();
    delete vcsApps.delete(this._id);
    destroyCollection(this._maps);
    destroyCollection(this._layers);
    destroyCollection(this._obliqueCollections);
    destroyCollection(this._viewPoints);
    destroyCollection(this._styles);
    destroyCollection(this._plugins);
    destroyCollection(this._contexts);
    destroyCollection(this._categories);
    this.destroyed.raiseEvent();
    this.destroyed.destroy();
  }
}

/**
 * @param {string} id
 * @returns {VcsApp}
 */
export function getVcsAppById(id) {
  return vcsApps.get(id);
}

window.vcs = window.vcs || {};
window.vcs.apps = vcsApps;

export default VcsApp;
