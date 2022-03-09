import { check } from '@vcsuite/check';
import { getLogger as getLoggerByName } from '@vcsuite/logger';

/**
 * @returns {Logger}
 */
function getLogger() {
  return getLoggerByName('plugin-helpers');
}

/**
 * @type {symbol}
 */
export const vcsAppSymbol = Symbol('vcsApp');

/**
 * @type {symbol}
 * @private
 */
export const pluginFactorySymbol = Symbol('pluginFactory');

/**
 * validates the name according to package name pattern
 * @param {string} name
 * @returns {boolean}
 */
// eslint-disable-next-line import/prefer-default-export
export function isValidPackageName(name) {
  check(name, String);

  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name);
}

/**
 * @param {VcsUiApp} app
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
    let plugin;
    if (window.VcsPluginLoaderFunction) { // TODO PluginLoaderfunction needs to be documented.
      plugin = await window.VcsPluginLoaderFunction(name, module);
    } else {
      plugin = await import(/* @vite-ignore */ module);
    }
    if (plugin.default == null || typeof plugin.default !== 'function') {
      getLogger().error(`plugin ${name} does not provide a default exported function`);
      return null;
    }
    const pluginInstance = await plugin.default(config);

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
 * @param {Object} serializedPlugin
 * @returns {Promise<VcsPlugin>}
 */
export async function deserializePlugin(serializedPlugin) {
  const reincarnation = await serializedPlugin[pluginFactorySymbol](serializedPlugin);
  reincarnation[pluginFactorySymbol] = serializedPlugin[pluginFactorySymbol];
  return reincarnation;
}
