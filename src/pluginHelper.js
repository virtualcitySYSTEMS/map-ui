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
 * A symbol added to each plugin which describes the module URL from which the plugin was loaded (with the filename and including searchParams)
 * @type {symbol}
 */
export const pluginModuleUrlSymbol = Symbol('pluginModuleUrl');
/**
 * A symbol added to each plugin which describes the configured version range
 * @type {symbol}
 */
export const pluginVersionRangeSymbol = Symbol('pluginVersionRange');

/**
 * A helper function to create an absolute URL from a relative plugin asset URL. For example, when
 * shipping your plugin with a "plugin-asset/icon.png", you can always retrieve said icon with getPluginAssetUrl(app, name, 'pluing-assets/icon.png')
 * Sets the plugin version as searchParam.
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
    assetUrl.searchParams.set('version', plugin.version);
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

  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    name,
  );
}

/**
 * @param {string} name
 * @param {PluginConfig} config
 * @returns {Promise<VcsPlugin|null>}
 */
export async function loadPlugin(name, config) {
  let module = config.entry;

  if (!/^(https?:\/\/|\/)/.test(module)) {
    module = `${window.location.origin}${window.location.pathname.replace(
      /\/?$/,
      '/',
    )}${module}`;
  } else if (module === '_dev') {
    module = `/${name}.js`;
  } else if (module === 'http://localhost/_test') {
    // early escape to bypass module loading for testing, see VcsUiApp.spec.js
    return null;
  }
  if (config.version) {
    const moduleUrl = new URL(module, window.location.href);
    moduleUrl.searchParams.set('version', config.version);
    module = moduleUrl.toString();
  }

  // if (!context.security.isTrustedUrl(module)) { XXX missing pipeline security
  //   getLogger().warning(`suppressed loading of insecure plugin ${module}`);
  //   return Promise.resolve();
  // }

  try {
    let plugin;
    if (window.VcsPluginLoaderFunction) {
      // TODO PluginLoaderfunction needs to be documented.
      plugin = await window.VcsPluginLoaderFunction(name, module);
    } else {
      plugin = await import(/* @vite-ignore */ module);
    }
    if (plugin.default == null || typeof plugin.default !== 'function') {
      getLogger().error(
        `plugin ${name} does not provide a default exported function`,
      );
      return null;
    }
    const baseUrl = new URL(module);
    baseUrl.pathname = baseUrl.pathname.replace(/\/[^/]+$/, '/');
    const pluginInstance = await plugin.default(config, baseUrl.toString());

    if (!(pluginInstance.name || pluginInstance.version)) {
      getLogger().error(
        `plugin ${name} does not conform to the VcsPlugin interface, which requires a name and version`,
      );
      if (pluginInstance.destroy) {
        pluginInstance.destroy();
      }
      return null;
    }
    if (!isValidPackageName(pluginInstance.name)) {
      getLogger().warning(
        `plugin ${pluginInstance.name} has no valid package name!`,
      );
    }
    pluginInstance[pluginFactorySymbol] = plugin.default;
    pluginInstance[pluginBaseUrlSymbol] = baseUrl.toString();
    pluginInstance[pluginModuleUrlSymbol] = module;
    pluginInstance[pluginVersionRangeSymbol] = config.version;
    return pluginInstance;
  } catch (err) {
    getLogger().error(`failed to load plugin ${name}`);
    getLogger().error(err);
  }
  return null;
}

/**
 * Returns relative url, if base is same, otherwise absolute url
 * Removes version from searchParams, since version is serialized itself
 * @param {string} base
 * @param {string} pluginUrl
 * @returns {string}
 */
export function getPluginEntry(base, pluginUrl) {
  const baseUrl = new URL(base);
  const pluginModuleUrl = new URL(pluginUrl);
  pluginModuleUrl.searchParams.delete('version'); // semver is part of config
  if (baseUrl.origin !== pluginModuleUrl.origin) {
    return pluginModuleUrl.toString();
  }
  const baseSubs = baseUrl.pathname.split('/');
  const pluginSubs = pluginModuleUrl.pathname.split('/');
  pluginModuleUrl.pathname = pluginSubs
    .filter((sub, idx) => sub !== baseSubs[idx])
    .join('/');
  return `${pluginModuleUrl.pathname}${pluginModuleUrl.search}`.substring(1);
}

/**
 * @param {VcsPlugin} plugin
 * @returns {Object}
 */
export function serializePlugin(plugin) {
  const serializedPlugin = plugin.toJSON ? plugin.toJSON() : {};
  serializedPlugin.name = plugin.name;
  if (serializedPlugin[pluginVersionRangeSymbol]) {
    serializedPlugin.version = serializedPlugin[pluginVersionRangeSymbol];
  }
  serializedPlugin.entry = getPluginEntry(
    window.location.href,
    plugin[pluginModuleUrlSymbol],
  );
  serializedPlugin[pluginFactorySymbol] = plugin[pluginFactorySymbol];
  serializedPlugin[pluginBaseUrlSymbol] = plugin[pluginBaseUrlSymbol];
  serializedPlugin[pluginModuleUrlSymbol] = plugin[pluginModuleUrlSymbol];
  serializedPlugin[pluginVersionRangeSymbol] = plugin[pluginVersionRangeSymbol];
  return serializedPlugin;
}

/**
 * @param {Object} serializedPlugin
 * @returns {Promise<VcsPlugin|null>}
 */
export async function deserializePlugin(serializedPlugin) {
  if (serializedPlugin[pluginFactorySymbol]) {
    const reincarnation = await serializedPlugin[pluginFactorySymbol](
      serializedPlugin,
    );
    reincarnation[pluginFactorySymbol] = serializedPlugin[pluginFactorySymbol];
    reincarnation[pluginBaseUrlSymbol] = serializedPlugin[pluginBaseUrlSymbol];
    reincarnation[pluginModuleUrlSymbol] =
      serializedPlugin[pluginModuleUrlSymbol];
    reincarnation[pluginVersionRangeSymbol] =
      serializedPlugin[pluginVersionRangeSymbol];
    return reincarnation;
  }
  return loadPlugin(serializedPlugin.name, serializedPlugin);
}
