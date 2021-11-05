import {
  Collection,
  DeclarativeStyleItem, Layer,
  MapCollection,
  Projection,
  referenceableStyleSymbol, setDefaultProjectionOptions,
  StyleType,
  VcsClassRegistry,
  VcsEvent,
  VectorStyleItem,
  ViewPoint,
} from '@vcmap/core';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import { v4 as uuidv4 } from 'uuid';
import Vue from 'vue';

import './layers.js';
import './maps.js';
import { getTerrainProviderForUrl } from '@vcmap/core/src/vcs/vcm/layer/terrainHelpers';
import ObliqueDataSet from '@vcmap/core/src/vcs/vcm/oblique/ObliqueDataSet';
import ObliqueCollection from '@vcmap/core/src/vcs/vcm/oblique/ObliqueCollection';

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
// XXX missing config-pipeline security
/**
 * @typedef {Object} VcsApp
 * @property {import("@vcmap/core").MapCollection} maps
 * @property {import("@vcmap/core").LayerCollection} layers
 * @property {import("@vcmap/core").Collection<import("@vcmap/core").ViewPoint>} viewpoints
 * @property {import("@vcmap/core").Collection<import("@vcmap/core").StyleItem>} styles
 * @property {import("@vcmap/core").Collection<import("@vcmap/core").ObliqueCollection>} obliqueCollections
 * @property {import("@vcmap/core").Collection<VcsPlugin>} plugins
 * @property {import("@vcmap/core").ViewPoint} startViewPoint
 * @property {Object<string, *>} config
 * @property {import("@vcmap/core").VcsEvent<void>} destroyed
 * @property {function():void} destroy
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
 * @param {string} id
 * @returns {VcsApp}
 */
export function getContextById(id) {
  return vcsApps.get(id);
}

/**
 * @returns {VcsApp}
 */
export function createVcsApp() {
  const maps = new MapCollection();
  const id = uuidv4();

  const vcsApp = {
    id,
    maps,
    layers: maps.layerCollection,
    viewpoints: new Collection(),
    styles: new Collection(),
    obliqueCollections: new Collection(),
    startViewPoint: new ViewPoint({}),
    config: {},
    plugins: new Map(),
    destroyed: new VcsEvent(),
    destroy() {
      delete vcsApps.delete(id);
      this.destroyed.raiseEvent();
      // TODO other destroy functions
    },
  };

  vcsApps.set(id, vcsApp);
  return vcsApp;
}

/**
 * returns a constructor of a type.
 * @api stable
 * @export
 * @param {Object} options
 * @returns {Promise<Object|null>}
 */
export async function getObjectFromOptions(options) {
  if (!options.type) {
    getLogger().warning(`ObjectCreation failed: could not find type in options ${options}`);
    return null;
  }
  const ObjectConstructor = await VcsClassRegistry.getClass(options.type);
  if (!ObjectConstructor) {
    getLogger().warning(`ObjectCreation failed: could not find javascript class of type ${options.type}`);
    return null;
  }
  let object = null;
  try {
    object = new ObjectConstructor(options);
  } catch (ex) {
    getLogger().warning(`Error: ${ex}`);
    object = null;
  }

  if (!object) {
    getLogger().warning('ObjectCreation failed: could not create new Object');
    return null;
  }
  return object;
}

/**
 * @param {import("@vcmap/core").VectorStyleItem.Options|import("@vcmap/core").DeclarativeStyleItem.Options} styleConfig
 * @param {VcsApp} context
 */
export function addStyleItem(styleConfig, context) {
  if (!styleConfig.name && !styleConfig.id) {
    getLogger().warning('styles need a name. please reconfigure the styles section.');
    return;
  }
  let styleItem;
  if (styleConfig.type === StyleType.DECLARATIVE || styleConfig.declarativeStyle) {
    styleItem = new DeclarativeStyleItem(
      /** @type {import("@vcmap/core").DeclarativeStyleItem.Options} */ (styleConfig),
    );
    if (!styleItem.cesiumStyle.ready) {
      getLogger().warning(`declarative style: ${styleConfig.name} has errors in the declarative style section and cannot be used`);
      return;
    }
  } else {
    styleItem = new VectorStyleItem(/** @type {import("@vcmap/core").VectorStyleItem.Options} */ (styleConfig));
  }
  if (!styleItem) {
    getLogger().warning(`could not create style item: ${styleConfig.name}`);
    return;
  }
  styleItem[referenceableStyleSymbol] = true;
  // FIXME configContentSymbol
  // styleItem[configContentSymbol] = true;
  if (context.styles.add(styleItem) != null) {
    getLogger().info(`added ${styleItem.className} with name ${styleItem.name}`);
  }
}

/**
 * creates an LayerObject of the given type and calls the init method of the object.
 * @param {import("@vcmap/core").Layer.Options} layerConfig the layerConfig
 * @param {VcsApp} context
 * @returns {Promise<void>}
 */
async function addLayer(layerConfig, context) {
  const layer = await getObjectFromOptions(layerConfig);
  if (!layer || !(layer instanceof Layer)) {
    getLogger().warning('Could not load Layer');
    return;
  }
  // FIXME configContentSymbol
  // layer[configContentSymbol] = true;
  if (context.layers.add(/** @type {import("@vcmap/core").Layer} */ layer) != null) {
    getLogger().info(`Loaded layer of type :${layerConfig.type} with name: ${layerConfig.name}`);
  }
}

/**
 * @param {import(@vcmap/core).ObliqueCollectionConfig} options
 * @param {VcsApp} context
 */
export function addObliqueCollection(options, context) {
  if (!Array.isArray(options.dataSets)) {
    getLogger().warning(`oblique collection ${options.name} is missing a datasets array`);
    return;
  }
  const collectionOptions = {
    ...options,
    dataSets: options.dataSets.map(({ url, projection, terrainUrl }) => {
      let usedProjection;
      if (projection) {
        const proj = new Projection(projection);
        usedProjection = proj.proj;
      }

      const terrainProvider = terrainUrl ? getTerrainProviderForUrl({ url: terrainUrl }) : undefined;
      return new ObliqueDataSet(url, usedProjection, terrainProvider);
    }),
  };

  if (context.obliqueCollections.add(new ObliqueCollection(collectionOptions)) != null) {
    getLogger().info(`Loaded oblique collection with name: ${options.name}`);
  }
}

/**
 * creates an MapWidgetObject of the given type</br>
 * and calls addMap() to add it to the framework.</br>
 * @param {Object} mapConfig the class name of the MapWidget
 * @param {VcsApp} context the class name of the MapWidget
 * @returns {Promise<import("@vcmap/core").VcsMap|null>}
 */
async function addMap(mapConfig, context) {
  const mapOptions = { ...mapConfig };
  mapOptions.layerCollection = context.layers;
  const map = await getObjectFromOptions(mapOptions);
  if (!map) { // XXX missing instance of basemap check
    getLogger().warning('Could not load map');
    return null;
  }
  map.mapElement.classList.add('vcm-map-top');
  if (context.maps.add(/** @type {import("@vcmap/core").VcsMap} */ map) != null) {
    getLogger().info(`Loaded map of type :${mapConfig.type} with name: ${mapConfig.name}`);
    return map;
  }
  return null;
}

/**
 * @param {VcsApp} context
 * @param {string} name
 * @param {PluginConfig} config
 * @param {string} [registry='https://plugins.virtualcitymap.de/']
 * @returns {Promise<void>}
 */
export function loadPlugin(context, name, config, registry = 'https://plugins.virtualcitymap.de/') {
  let module = config.entry;

  if (!module) {
    module = `${registry.replace(/\/?$/, '')}/${name}/${config.version || '*'}/index.js`;
  } else if (!/^(https?:\/\/|\/)/.test(module)) {
    module = `${window.location.origin}${window.location.pathname.replace(/\/?$/, '/')}${module}`;
  } else if (module === '_dev') {
    module = `/${name}.js`;
  }

  // if (!context.security.isTrustedUrl(module)) { XXX missing pipeline security
  //   getLogger().warning(`suppressed loading of insecure plugin ${module}`);
  //   return Promise.resolve();
  // }

  return import(/* @vite-ignore */ module)
    .then((plugin) => {
      if (!context.plugins.has(name)) {
        const actualPlugin = plugin.default || plugin;
        context.plugins.set(name, actualPlugin);
      } else {
        getLogger().warning(`cannot load plugin ${name} twice`);
      }
    })
    .catch((err) => {
      getLogger().error(`failed to load plugin ${name}`);
      getLogger().error(err);
    });
}

// XXX should be config typed
/**
 * @param {Object} config
 * @param {VcsApp} context TODO this is the VcsApp for now, this should become a context
 * @returns {Promise<import("@vcmap/core").VcsMap|null>}
 */
export async function addConfigToContext(config, context) {
  // IDEA this could be an array
  context.config = config;

  if (Array.isArray(config.plugins)) {
    await Promise.all(config.plugins.map(pluginConfig => loadPlugin(context, pluginConfig.name, pluginConfig)));
  }

  await Promise.all([...context.plugins.values()].map(async (plugin) => {
    if (plugin.preInitialize) {
      await plugin.preInitialize(config.plugins.find(p => p.name === plugin.name));
    }
  }));
  setDefaultProjectionOptions(config.projection);

  if (Array.isArray(config.styles)) {
    config.styles.forEach((styleConfig) => {
      addStyleItem(styleConfig, context);
    });
  }

  // TODO add flights & ade here
  if (Array.isArray(config.layers)) {
    await Promise.all(config.layers.map(layerConfig => addLayer(layerConfig, context)));
  }

  [...context.layers].forEach((l) => {
    if (l.activeOnStartup) {
      l.activate()
        .catch((err) => {
          getLogger().error(`Failed to activate active on startup layer ${l.name}`);
          getLogger().error(err);
          context.layers.remove(l);
          l.destroy();
        });
    }
  });

  if (Array.isArray(config.obliqueCollections)) {
    config.obliqueCollections.forEach((options) => {
      addObliqueCollection(options, context);
    });
  }

  if (Array.isArray(config.viewpoints)) {
    config.viewpoints.forEach((viewpointConfig) => {
      context.viewpoints.add(new ViewPoint(viewpointConfig));
    });
  }

  if (config.startViewPoint) {
    context.startViewPoint = context.viewpoints.getByKey(config.startViewPoint);
  }

  let startingMap = null;
  if (Array.isArray(config.maps)) {
    await Promise.all(config.maps.map(async (mapConfig) => {
      const map = await addMap(mapConfig, context);
      if (map && (mapConfig.startingmap || !startingMap)) {
        startingMap = map;
      }
    }));
  }

  await Promise.all([...context.plugins.values()].map(async (plugin) => {
    if (plugin.postInitialize) {
      await plugin.postInitialize(config.plugins.find(p => p.name === plugin.name));
    }
  }));
  return startingMap;
  // TODO activate map here before loading widgets? or should widgets be like layersin future (makes more sense) so we can
  // move activating the map out of the config parsing?
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
 * @param {VcsApp} context
 * @param {PluginComponents} pluginComponents
 * @returns {Promise<void>}
 */
export async function setPluginUiComponents(context, pluginComponents) {
  await Promise.all([...context.plugins.values()].map(async (plugin) => {
    if (plugin.registerUiPlugin) {
      const config = await plugin.registerUiPlugin(context.config.plugins.find(p => p.name === plugin.name));
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
