import { VcsClassRegistry } from '@vcmap/core';
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
 * @param {VcsApp} vcsApp
 * @param {import("@vcmap/core").VcsMapOptions} mapConfig
 * @returns {Promise<import("@vcmap/core").VcsMap|null>}
 */
export async function deserializeMap(vcsApp, mapConfig) {
  const map = await getObjectFromOptions(mapConfig);
  if (map) {
    map.layerCollection = vcsApp.layers;
  }
  return map;
}

/**
 * @param {VcsPlugin} plugin
 * @returns {Object}
 */
export function serializePlugin(plugin) {
  const serializedPlugin = plugin.toJSON ? plugin.toJSON() : {};
  if (plugin[pluginFactorySymbol]) {
    serializedPlugin[pluginFactorySymbol] = plugin[pluginFactorySymbol];
  }
  return serializedPlugin;
}

/**
 * @param {VcsApp} app
 * @param {Object} serializedPlugin
 * @returns {Promise<VcsPlugin>}
 */
export async function deserializePlugin(app, serializedPlugin) {
  const reincarnation = await serializedPlugin[pluginFactorySymbol](app, serializedPlugin);
  reincarnation[pluginFactorySymbol] = serializedPlugin[pluginFactorySymbol];
  return reincarnation;
}

/**
 * @param {import("@vcmap/core").ViewPointOptions} viewPointObject
 * @returns {Promise<null|ViewPoint>}
 */
export async function deserializeViewPoint(viewPointObject) {
  const viewpoint = /** @type {import("@vcmap/core").ViewPoint} */ (await getObjectFromOptions(viewPointObject));
  if (viewpoint && viewpoint.isValid()) {
    return viewpoint;
  }
  getLogger().warning(`Viewpoint ${viewPointObject.name} is not valid`);
  return null;
}

/**
 * @param {VcsApp} vcsApp
 * @param {import("@vcmap/core").Layer} layer
 * @returns {Promise<import("@vcmap/core").LayerOptions|null>}
 */
export async function serializeLayer(vcsApp, layer) {
  const serializedLayer = layer.toJSON();
  serializedLayer.zIndex = layer[vcsApp.layers.zIndexSymbol];
  return serializedLayer;
}

/**
 * @param {import("@vcmap/core").Layer} current
 * @param {import("@vcmap/core").Layer} previous
 * @param {number} currentIndex
 * @returns {number|null}
 */
export function getLayerIndex(current, previous, currentIndex) {
  if (current.zIndex !== previous.zIndex) {
    return null;
  }
  return currentIndex;
}

/**
 * @param {import("@vcmap/core").Collection<*>} collection
 */
export function destroyCollection(collection) {
  [...collection].forEach((i) => {
    if (i.destroy && !i.isDestroyed) {
      i.destroy();
    }
  });
  collection.destroy();
}
