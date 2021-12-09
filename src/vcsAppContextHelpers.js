import {
  DeclarativeStyleItem,
  getTerrainProviderForUrl,
  ObliqueCollection,
  ObliqueDataSet,
  Projection,
  referenceableStyleSymbol,
  StyleType,
  VcsClassRegistry,
  VcsMap,
  VectorStyleItem,
} from '@vcmap/core';
import { getLogger as getLoggerByName } from '@vcsuite/logger';

/**
 * @returns {Logger}
 */
function getLogger() {
  return getLoggerByName('init');
}

/**
 * @type {symbol}
 */
export const contextIdSymbol = Symbol('contextId');

/**
 * @type {symbol}
 * @private
 */
export const pluginFactorySymbol = Symbol('pluginFactory');

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
  let object;
  try {
    object = new ObjectConstructor(options);
  } catch (ex) {
    getLogger().warning(`Error: ${ex}`);
  }

  if (!object) {
    getLogger().warning('ObjectCreation failed: could not create new Object');
    return null;
  }
  return object;
}

/**
 * @param {import("@vcmap/core").VectorStyleItemOptions|import("@vcmap/core").DeclarativeStyleItemOptions} styleConfig
 * @returns {import("@vcmap/core").StyleItem|null}
 */
export function createStyleItem(styleConfig) { // TODO make same factory as layer and maps?
  if (!styleConfig.name && !styleConfig.id) {
    getLogger().warning('styles need a name. please reconfigure the styles section.');
    return null;
  }
  let styleItem;
  if (styleConfig.type === StyleType.DECLARATIVE || styleConfig.declarativeStyle) {
    styleItem = new DeclarativeStyleItem(
      /** @type {import("@vcmap/core").DeclarativeStyleItem.Options} */ (styleConfig),
    );
    if (!styleItem.cesiumStyle.ready) {
      getLogger().warning(`declarative style: ${styleConfig.name} has errors in the declarative style section and cannot be used`);
      return null;
    }
  } else {
    styleItem = new VectorStyleItem(/** @type {import("@vcmap/core").VectorStyleItem.Options} */ (styleConfig));
  }
  if (!styleItem) {
    getLogger().warning(`could not create style item: ${styleConfig.name}`);
    return null;
  }
  styleItem[referenceableStyleSymbol] = true;
  return styleItem;
}

/**
 * @param {import(@vcmap/core).ObliqueCollectionConfig} options
 * @returns {import("@vcmap/core").ObliqueCollection|null}
 */
export function createObliqueCollection(options) {
  if (!Array.isArray(options.dataSets)) {
    getLogger().warning(`oblique collection ${options.name} is missing a datasets array`);
    return null;
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

  return new ObliqueCollection(collectionOptions);
}

/**
 * @param {VcsApp} app
 * @param {string} name
 * @param {PluginConfig} config
 * @param {string} [registry='https://plugins.virtualcitymap.de/']
 * @returns {Promise<VcsPlugin|null>}
 */
export async function loadPlugin(app, name, config, registry = 'https://plugins.virtualcitymap.de/') {
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

  try {
    const plugin = await import(/* @vite-ignore */ module);
    if (plugin.default == null || typeof plugin.default !== 'function') {
      getLogger().error(`plugin ${name} does not provide a default exported function`);
      return null;
    }
    const pluginInstance = await plugin.default(app, config);

    if (!pluginInstance.name) {
      getLogger().error(`plugin ${name} does not expose a name`);
      if (pluginInstance.destroy) {
        pluginInstance.destroy();
      }
      return null;
    }
    pluginInstance[pluginFactorySymbol] = plugin.default;
    return pluginInstance;
  } catch (err) {
    getLogger().error(`failed to load plugin ${name}`);
    getLogger().error(err);
  }
  return null;
}

/**
 * Adds an object to a collection and creates a shadow from any existing object with the same identifier
 * property (e.g. name).
 * @template {import("@vcmap/core").VcsObject|VcsPlugin} T
 * @param {T} item
 * @param {import("@vcmap/core").Collection<T>} collection
 * @param {Map<string, Array<Object>>} shadowMap
 * @returns {T|null}
 */
export function addObjectToCollection(item, collection, shadowMap) {
  if (collection.hasKey(item.name)) {
    const shadow = collection.getByKey(item.name);
    collection.remove(shadow);
    if (!shadowMap.has(item.name)) {
      shadowMap.set(item.name, []);
    }
    const shadowsArray = shadowMap.get(item.name);
    const serializedShadow = shadow.toJSON ? shadow.toJSON() : {};
    if (shadow.destroy) {
      shadow.destroy();
    }
    if (shadow[pluginFactorySymbol]) {
      serializedShadow[pluginFactorySymbol] = shadow[pluginFactorySymbol];
    }
    serializedShadow[contextIdSymbol] = shadow[contextIdSymbol];
    shadowsArray.push(serializedShadow);
  }
  if (collection.add(item) >= 0) {
    return item;
  }
  return null;
}

/**
 * @template {import("@vcmap/core").VcsObject} T
 * @param {Array<Object>} [configArray]
 * @param {import("@vcmap/core").Collection<T>} collection
 * @param {Map<string, Array<Object>>} shadowMap
 * @param {string} contextId
 * @param {function(new: T)=} ctor
 * @returns {Promise<void>}
 */
export async function addConfigArrayToCollection(configArray, collection, shadowMap, contextId, ctor) {
  if (Array.isArray(configArray)) {
    const instanceArray = await Promise.all(configArray.map(async (config) => {
      const item = await getObjectFromOptions(config);
      if (!item || (ctor && !(item instanceof ctor))) {
        getLogger().warning(`Could not load item ${config.name} of type ${config.type}`);
        return null;
      }
      item[contextIdSymbol] = contextId;
      return item;
    }));
    instanceArray
      .filter(i => i)
      .forEach((i) => { addObjectToCollection(i, collection, shadowMap); });
  }
}

/**
 * @param {string} contextId
 * @param {ShadowMaps} shadowMaps
 */
export function removeContextFromShadowMaps(contextId, shadowMaps) {
  Object.values(shadowMaps)
    .forEach(/** @param {Map<string, Array<Object>>} shadowMap */ (shadowMap) => {
      shadowMap.forEach((shadowsArray, name) => {
        const newShadowsArray = shadowsArray.filter(c => c[contextIdSymbol] !== contextId);
        if (newShadowsArray.length === 0) {
          shadowMap.delete(name);
        } else if (newShadowsArray.length !== shadowsArray.length) {
          shadowMap.set(name, newShadowsArray);
        }
      });
    });
}

/**
 * @param {string} contextId
 * @param {import("@vcmap/core").Collection<*>} collection
 * @param {Map<string, Array<Object>>} shadowMap
 * @param {VcsApp} app
 */
export async function removeContextFromVcsObjectCollection(contextId, collection, shadowMap, app) {
  await Promise.all([...collection]
    .filter(item => item[contextIdSymbol] === contextId)
    .map(async (item) => {
      collection.remove(item);
      if (shadowMap.has(item.name)) {
        const serializedShadow = shadowMap.get(item.name).pop();
        if (serializedShadow) {
          let reincarnation;
          if (item instanceof VcsMap) {
            reincarnation = await getObjectFromOptions(serializedShadow);
            reincarnation.layerCollection = app.layers;
          } else if (serializedShadow[pluginFactorySymbol]) {
            reincarnation = await serializedShadow[pluginFactorySymbol](app, serializedShadow);
            reincarnation[pluginFactorySymbol] = serializedShadow[pluginFactorySymbol];
          } else {
            reincarnation = await getObjectFromOptions(serializedShadow);
          }
          reincarnation[contextIdSymbol] = serializedShadow[contextIdSymbol];
          collection.add(reincarnation);
        }

        if (shadowMap.get(item.name).length === 0) {
          shadowMap.delete(item.name);
        }
      }

      if (item.destroy) {
        item.destroy();
      }
    }));
}
