import {
  Collection,
  IndexedCollection,
  Layer,
  MapCollection,
  setDefaultProjectionOptions,
  StyleItem,
  VcsEvent,
  VcsMap,
  ViewPoint,
} from '@vcmap/core';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import { v4 as uuidv4 } from 'uuid';
import Vue from 'vue';
import { check } from '@vcsuite/check';

import Context from './context.js';
import {
  addObjectToCollection,
  contextIdSymbol,
  loadPlugin,
  removeContextFromShadowMaps,
  removeContextFromVcsObjectCollection,
  addConfigArrayToCollection,
} from './vcsAppContextHelpers.js';

/**
 * @typedef {Object} PluginComponents
 * @property {Array<Vue>} mapButtons
 * @property {Array<Vue>} treeButtons
 * @property {Array<Vue>} headerButtons
 */

/**
 * @typedef {Object} PluginConfig
 * @property {string} name
 * @property {string|undefined} entry
 * @property {string|undefined} version
 */

/**
 * @interface VcsPlugin
 * @property {string} version
 * @property {string} name
 * @property {function(PluginConfig):Promise<void>} preInitialize
 * @property {function(PluginConfig):Promise<void>} postInitialize
 * @property {function(PluginConfig):Promise<vcs.ui.PluginOptions>} registerUiPlugin
 * @property {function(PluginConfig):Promise<void>} postUiInitialize
 * @property {function():Promise<void>} destroy
 * @api
 */

/**
 * @typedef {Object} ShadowMaps
 * @property {Map<string, Array<import("@vcmap/core").VcsMapOptions>>} maps
 * @property {Map<string, Array<import("@vcmap/core").LayerOptions>>} layers
 * @property {Map<string, Array<import("@vcmap/core").ViewPointOptions>>} viewPoints
 * @property {Map<string, Array<import("@vcmap/core").StyleItemOptions>>} styles
 * @property {Map<string, Array<import("@vcmap/core").ObliqueCollectionOptions>>} obliqueCollections
 * @property {Map<string, Array<Object>>} plugins
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
 * @param {import("@vcmap/core").Collection<*>} collection
 */
function destroyCollection(collection) {
  [...collection].forEach((i) => {
    if (i.destroy) {
      i.destroy();
    }
  });
  collection.destroy();
}
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
    /**
     * @type {Array<function():void>}
     * @private
     */
    this._collectionListeners = [];
    /**
     * @type {import("@vcmap/core").MapCollection}
     * @private
     */
    this._maps = new MapCollection();
    this._addCollectionListener(this._maps);
    /**
     * @type {import("@vcmap/core").LayerCollection}
     * @private
     */
    this._layers = this._maps.layerCollection;
    this._addCollectionListener(this._layers);
    /**
     * @type {import("@vcmap/core").Collection<import("@vcmap/core").ObliqueCollection>}
     * @private
     */
    this._obliqueCollections = new Collection(); // XXX there is a global for this collection in core.
    this._addCollectionListener(this._obliqueCollections);
    /**
     * @type {import("@vcmap/core").Collection<import("@vcmap/core").ViewPoint>}
     * @private
     */
    this._viewPoints = new Collection();
    this._addCollectionListener(this._viewPoints);
    /**
     * @type {import("@vcmap/core").Collection<import("@vcmap/core").StyleItem>}
     * @private
     */
    this._styles = new Collection(); // XXX there is a global for this collection in core.
    this._addCollectionListener(this._styles);
    /**
     * @type {import("@vcmap/core").Collection<VcsPlugin>}
     * @private
     */
    this._plugins = new Collection();
    this._addCollectionListener(this._plugins);
    /**
     * @type {import("@vcmap/core").IndexedCollection<Context>}
     * @private
     */
    this._contexts = new IndexedCollection('id');
    this._contexts.add(this._dynamicContext);
    /**
     * @type {ShadowMaps}
     * @private
     */
    this._shadowMaps = {
      layers: new Map(),
      maps: new Map(),
      obliqueCollections: new Map(),
      viewPoints: new Map(),
      styles: new Map(),
      plugins: new Map(),
    };
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
  }

  /**
   * @type {string}
   * @readonly
   */
  get id() { return this._id; }

  /**
   * @type {import("@vcmap/core").MapCollection}
   * @readonly
   */
  get maps() { return this._maps; }

  /**
   * @type {import("@vcmap/core").LayerCollection}
   * @readonly
   */
  get layers() { return this._layers; }

  /**
   * @type {import("@vcmap/core").Collection<import("@vcmap/core").ObliqueCollection>}
   * @readonly
   */
  get obliqueCollections() { return this._obliqueCollections; }

  /**
   * @type {import("@vcmap/core").Collection<import("@vcmap/core").ViewPoint>}
   * @readonly
   */
  get viewPoints() { return this._viewPoints; }

  /**
   * @type {import("@vcmap/core").Collection<import("@vcmap/core").StyleItem>}
   * @readonly
   */
  get styles() { return this._styles; }

  /**
   * @type {import("@vcmap/core").Collection<VcsPlugin>}
   * @readonly
   */
  get plugins() { return this._plugins; }

  /**
   * @type {import("@vcmap/core").VcsEvent<void>}
   * @readonly
   */
  get destroyed() { return this._destroyed; }

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

  /**
   * @param {string} id
   * @returns {Context}
   */
  getContextById(id) {
    return this._contexts.getByKey(id);
  }

  /**
   * @param {import("@vcmap/core").Collection} collection
   * @private
   */
  _addCollectionListener(collection) {
    this._collectionListeners.push(collection.added.addEventListener((item) => {
      if (!item[contextIdSymbol]) {
        item[contextIdSymbol] = this._dynamicContext.id;
      }
    }));
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
        plugin[contextIdSymbol] = context.id;
        return plugin;
      }));

      plugins = plugins
        .filter(p => p)
        .map(p => addObjectToCollection(p, this._plugins, this._shadowMaps.plugins))
        .filter(p => p);
    }

    if (config.projection) { // XXX this needs fixing. this should be _projections_ and there should be a `defaultProjection`
      setDefaultProjectionOptions(config.projection);
    }

    await addConfigArrayToCollection(
      config.styles,
      this._styles,
      this._shadowMaps.styles,
      context.id,
      StyleItem,
    );

    // TODO add flights & ade here
    await addConfigArrayToCollection(
      config.layers,
      this._layers,
      this._shadowMaps.layers,
      context.id,
      Layer,
    );

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
    // TODO oblique collections
    // if (Array.isArray(config.obliqueCollections)) {
    //   config.obliqueCollections.forEach((options) => {
    //     const collection = createObliqueCollection(options);
    //     if (collection) {
    //       collection[contextIdSymbol] = context.id;
    //       this._obliqueCollections.add(collection);
    //     }
    //   });
    // }

    if (Array.isArray(config.viewpoints)) {
      config.viewpoints.forEach((viewpointConfig) => { // TODO make this also _typed_?
        const viewpoint = new ViewPoint(viewpointConfig);
        if (!viewpoint.isValid()) {
          getLogger().warning(`Viewpoint ${viewpoint.name} is not valid`);
        } else {
          viewpoint[contextIdSymbol] = context.id;
          addObjectToCollection(viewpoint, this._viewPoints, this._shadowMaps.viewPoints);
        }
      });
    }

    await addConfigArrayToCollection(
      config.maps,
      this._maps,
      this._shadowMaps.maps,
      context.id,
      VcsMap,
    );
    [...this._maps]
      .filter(m => m[contextIdSymbol] === context.id)
      .forEach((m) => { m.layerCollection = this._layers; });

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

    await Promise.all(plugins.map(async (plugin) => {
      if (plugin.postInitialize) {
        await plugin.postInitialize();
      }
    }));

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

    removeContextFromShadowMaps(contextId, this._shadowMaps);
    await Promise.all([
      removeContextFromVcsObjectCollection(contextId, this._maps, this._shadowMaps.maps, this),
      removeContextFromVcsObjectCollection(contextId, this._layers, this._shadowMaps.layers, this),
      removeContextFromVcsObjectCollection(contextId, this._viewPoints, this._shadowMaps.viewPoints, this),
      // TODO styles & oblique collections. wait for styles to implement VcsObject
      removeContextFromVcsObjectCollection(contextId, this._plugins, this._shadowMaps.plugins, this),
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
    delete vcsApps.delete(this._id);
    this._collectionListeners.forEach((listener) => { listener(); });
    this._collectionListeners.splice(0);
    destroyCollection(this._maps);
    destroyCollection(this._layers);
    destroyCollection(this._obliqueCollections);
    destroyCollection(this._viewPoints);
    destroyCollection(this._styles);
    destroyCollection(this._plugins);
    destroyCollection(this._contexts);
    this._shadowMaps = {
      layers: new Map(),
      maps: new Map(),
      obliqueCollections: new Map(),
      viewPoints: new Map(),
      styles: new Map(),
      plugins: new Map(),
    };
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

/**
 * @type {Map<string, Map<string, Set<string>>>} a map of plugin name keys. value is a Map of types. The set represents the names used. default is to use the size as the next name
 */
const pluginComponentNames = new Map();

/**
 * @param {string} pluginName
 * @param {string} type
 * @param {Vue|string} component
 * @returns {string}
 */
function createComponent(pluginName, type, component) {
  if (!pluginComponentNames.has(pluginName)) {
    pluginComponentNames.set(pluginName, new Map());
  }

  const componentNames = pluginComponentNames.get(pluginName);
  if (!componentNames.has(type)) {
    componentNames.set(type, new Set());
  }

  const actualComponent = typeof component === 'string' ?
    { template: component } :
    component;

  if (!actualComponent.name) {
    actualComponent.name = `${type}-${componentNames.get(type).size}`;
  }
  actualComponent.name = `${pluginName}-${actualComponent.name}`;

  if (componentNames.get(type).has(actualComponent.name)) {
    return actualComponent.name;
  }
  componentNames.get(type).add(actualComponent.name);

  Vue.component(actualComponent.name, actualComponent);
  return actualComponent.name;
}

const componentTypes = {
  mapButton: 'mapButtons',
};

/**
 * @param {VcsApp} app
 * @param {PluginComponents} pluginComponents
 * @returns {Promise<void>}
 */
export async function setPluginUiComponents(app, pluginComponents) {
  await Promise.all([...app.plugins].map(async (plugin) => {
    if (plugin.registerUiPlugin) {
      const config = await plugin.registerUiPlugin();
      Object.entries(componentTypes)
        .forEach(([configType, componentType]) => {
          if (config[configType]) {
            const componentsArray = Array.isArray(config[configType]) ? config[configType] : [config[configType]];
            const components = componentsArray
              .map(component => createComponent(plugin.name, configType, component));
            pluginComponents[componentType].push(...components);
          }
        });
    }
  }));
}

window.vcs = window.vcs || {};
window.vcs.apps = vcsApps;

export default VcsApp;
