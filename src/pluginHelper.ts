import { getCaughtError } from '@vcmap/core';
import { check } from '@vcsuite/check';
import type { Logger } from '@vcsuite/logger';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import { satisfies } from 'semver';
import type VcsUiApp from './vcsUiApp.js';
import packageJson from '../package.json' with { type: 'json' };
import type {
  PluginConfig,
  SerializedPluginConfig,
  VcsPlugin,
} from './vcsUiApp.js';

function getLogger(): Logger {
  return getLoggerByName('plugin-helpers');
}

export const vcsAppSymbol = Symbol('vcsApp');

export const pluginFactorySymbol = Symbol('pluginFactory');

/**
 * A symbol added to each plugin which describes the base URL from which the plugin was loaded (without the filename)
 */
export const pluginBaseUrlSymbol = Symbol('pluginBaseUrl');

/**
 * A symbol added to each plugin which describes the module URL from which the plugin was loaded (with the filename and including searchParams)
 */
export const pluginModuleUrlSymbol = Symbol('pluginModuleUrl');

/**
 * A symbol added to each plugin which describes the configured version range
 */
export const pluginVersionRangeSymbol = Symbol('pluginVersionRange');

/**
 * A helper function to create an absolute URL from a relative plugin asset URL. For example, when
 * shipping your plugin with a "plugin-asset/icon.png", you can always retrieve said icon with getPluginAssetUrl(app, name, 'pluing-assets/icon.png')
 * Sets the plugin version as searchParam.
 * Returns null, if the plugin does not exist.
 */
export function getPluginAssetUrl(
  app: VcsUiApp,
  pluginName: string,
  asset: string,
): string | null {
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
 */

export function isValidPackageName(name: string): boolean {
  check(name, String);
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    name,
  );
}

/**
 * joins pathname and moduleUrl.
 * @param pathname will remove filenames with extension or add a trailing slash if missing
 * @param module relative url to the module
 */
export function getModuleUrl(pathname: string, module: string): string {
  const pathNameParts = pathname.split('/');
  if (pathNameParts.at(-1)?.includes('.')) {
    pathNameParts.pop();
  } else if (pathNameParts.at(-1) === '') {
    pathNameParts.pop();
  }
  const pathName = pathNameParts.join('/');
  return `${pathName}/${module}`;
}

export async function loadPlugin(
  name: string,
  config: PluginConfig,
): Promise<VcsPlugin | null> {
  let module = config.entry ?? '';

  if (!/^(https?:\/\/|\/)/.test(module)) {
    module = `${window.location.origin}${getModuleUrl(window.location.pathname, module)}`;
  } else if (module === '_dev') {
    module = `/${name}.js`;
  } else if (module === 'http://localhost/_test') {
    // early escape to bypass module loading for testing, see import("@src/vcsUiApp.js").default.spec.js
    return null;
  }
  const moduleUrl = new URL(module, window.location.href);
  if (config.version) {
    moduleUrl.searchParams.set('version', config.version);
  }
  moduleUrl.searchParams.set('mapVersion', packageJson.version);
  module = moduleUrl.toString();

  // if (!context.security.isTrustedUrl(module)) { XXX missing pipeline security
  //   getLogger().warning(`suppressed loading of insecure plugin ${module}`);
  //   return Promise.resolve();
  // }

  try {
    let plugin;
    if (window.VcsPluginLoaderFunction) {
      // TODO PluginLoaderfunction needs to be documented.
      // eslint-disable-next-line new-cap
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
    if (pluginInstance.mapVersion) {
      if (
        !satisfies(packageJson.version, pluginInstance.mapVersion, {
          includePrerelease: true,
        })
      ) {
        getLogger().warning(
          `plugin ${pluginInstance.name} of version ${pluginInstance.version} with map version range ${pluginInstance.mapVersion} does not satisfy version ${packageJson.version} of this VC Map!`,
        );
      }
    } else {
      getLogger().warning(
        `plugin ${pluginInstance.name} of version ${pluginInstance.version} does not provide a mapVersion!`,
      );
    }

    pluginInstance[pluginFactorySymbol] = plugin.default;
    pluginInstance[pluginBaseUrlSymbol] = baseUrl.toString();
    pluginInstance[pluginModuleUrlSymbol] = module;
    pluginInstance[pluginVersionRangeSymbol] = config.version;
    return pluginInstance;
  } catch (e: unknown) {
    getLogger().error(`failed to load plugin ${name}`);
    getLogger().error(getCaughtError(e).message);
  }
  return null;
}

/**
 * Returns relative url, if base is same, otherwise absolute url
 * Removes version from searchParams, since version is serialized itself
 */
export function getPluginEntry(base: string, pluginUrl: string): string {
  const baseUrl = new URL(base);
  const pluginModuleUrl = new URL(pluginUrl);
  pluginModuleUrl.searchParams.delete('version'); // semver is part of config
  pluginModuleUrl.searchParams.delete('mapVersion'); // semver is set on loadPlugin by the app
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

export function serializePlugin(plugin: VcsPlugin): SerializedPluginConfig {
  const serializedPlugin: SerializedPluginConfig = {
    ...plugin.toJSON?.(),
    name: plugin.name,
  };
  if (plugin[pluginVersionRangeSymbol]) {
    serializedPlugin.version = plugin[pluginVersionRangeSymbol];
  }
  serializedPlugin.entry = getPluginEntry(
    window.location.href,
    plugin[pluginModuleUrlSymbol] as string,
  );
  serializedPlugin[pluginFactorySymbol] = plugin[pluginFactorySymbol];
  serializedPlugin[pluginBaseUrlSymbol] = plugin[pluginBaseUrlSymbol];
  serializedPlugin[pluginModuleUrlSymbol] = plugin[pluginModuleUrlSymbol];
  serializedPlugin[pluginVersionRangeSymbol] = plugin[pluginVersionRangeSymbol];
  return serializedPlugin;
}

export async function deserializePlugin(
  serializedPlugin: SerializedPluginConfig,
): Promise<VcsPlugin | null> {
  // the factory symbol is untyped on SerializedPluginConfig, since it is only ever set by serializePlugin
  const factory = serializedPlugin[pluginFactorySymbol] as
    | ((config: SerializedPluginConfig) => Promise<VcsPlugin>)
    | undefined;
  if (factory) {
    const reincarnation = await factory(serializedPlugin);
    reincarnation[pluginFactorySymbol] = factory;
    reincarnation[pluginBaseUrlSymbol] = serializedPlugin[
      pluginBaseUrlSymbol
    ] as string | undefined;
    reincarnation[pluginModuleUrlSymbol] = serializedPlugin[
      pluginModuleUrlSymbol
    ] as string | undefined;
    reincarnation[pluginVersionRangeSymbol] = serializedPlugin[
      pluginVersionRangeSymbol
    ] as string | undefined;
    return reincarnation;
  }
  return loadPlugin(serializedPlugin.name, serializedPlugin);
}
