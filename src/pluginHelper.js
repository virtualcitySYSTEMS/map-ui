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
 * A symbol added to each plugin which describes the base URL from which the plugin was loaded (without the filename)
 * @type {symbol}
 */
export const pluginBaseUrlSymbol = Symbol('pluginBaseUrl');

/**
 * A helper function to create an absolute URL from a relative plugin asset URL. For example, when
 * shipping your plugin with a "plugin-asset/icon.png", you can always retrieve said icon with getPluginAssetUrl(app, name, 'pluing-assets/icon.png')
 * Returns null, if the plugin does not exist.
 * @param {VcsUiApp} app
 * @param {string} pluginName
 * @param {string} asset
 * @returns {string|null}
 */
export function getPluginAssetUrl(app, pluginName, asset) {
  check(pluginName, String);
  check(asset, String);

  const plugin = app.plugins.getByKey(pluginName);
  if (plugin && plugin[pluginBaseUrlSymbol]) {
    const baseUrl = new URL(plugin[pluginBaseUrlSymbol]);
    const assetUrl = new URL(asset.replace(/^\//, '/'), baseUrl);
    baseUrl.searchParams.forEach((value, key) => {
      if (!assetUrl.searchParams.has(key)) {
        assetUrl.searchParams.set(key, value);
      }
    });
    return assetUrl.toString();
  }
  return null;
}

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
 * @param {string} name
 * @param {PluginConfig} config
 * @returns {Promise<VcsPlugin|null>}
 */
export async function loadPlugin(name, config) {
  let module = config.entry;

  if (!/^(https?:\/\/|\/)/.test(module)) {
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
    const baseUrl = new URL(module);
    baseUrl.pathname = baseUrl.pathname.replace(/\/[^/]+$/, '/');
    const pluginInstance = await plugin.default(config, baseUrl.toString());

    if (!pluginInstance.name) {
      getLogger().error(`plugin ${name} does not expose a name`);
      if (pluginInstance.destroy) {
        pluginInstance.destroy();
      }
      return null;
    }
    pluginInstance[pluginFactorySymbol] = plugin.default;
    pluginInstance[pluginBaseUrlSymbol] = baseUrl.toString();
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
  serializedPlugin[pluginFactorySymbol] = plugin[pluginFactorySymbol];
  serializedPlugin[pluginBaseUrlSymbol] = plugin[pluginBaseUrlSymbol];
  return serializedPlugin;
}

/**
 * @param {Object} serializedPlugin
 * @returns {Promise<VcsPlugin>}
 */
export async function deserializePlugin(serializedPlugin) {
  const reincarnation = await serializedPlugin[pluginFactorySymbol](serializedPlugin);
  reincarnation[pluginFactorySymbol] = serializedPlugin[pluginFactorySymbol];
  reincarnation[pluginBaseUrlSymbol] = serializedPlugin[pluginBaseUrlSymbol];
  return reincarnation;
}
