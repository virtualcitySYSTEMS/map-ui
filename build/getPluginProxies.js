/* eslint import/no-extraneous-dependencies: ["error", { "devDependencies": false }] */
import path from 'node:path';
import { existsSync } from 'node:fs';
import {
  getInlinePlugins,
  getPluginDirectory,
  getPluginNames,
} from './buildHelpers.js';

async function getTsPlugins(pluginsDir, plugins) {
  return plugins.filter((plugin) =>
    existsSync(
      path.join(pluginsDir, 'node_modules', plugin, 'src', 'index.ts'),
    ),
  );
}

/**
 * Determines the proxy setting to serve plugins referrenced in the package.json in the plugins directory
 * @param {string} [target=http://localhost:8080]
 * @param {boolean} [production=false]
 * @returns {Promise<Record<string, string | import("vite").ProxyOptions>>}
 */
export default async function getPluginProxies(
  target = 'http://localhost:8080',
  production = false,
) {
  const root = process.cwd();
  const pluginsDir = getPluginDirectory();
  const plugins = await getPluginNames();
  const tsPlugins = await getTsPlugins(pluginsDir, plugins);
  const proxies = {};

  plugins.forEach((plugin) => {
    const indexJs = tsPlugins.includes(plugin) ? 'index.ts' : 'index.js';
    proxies[`^/plugins/${plugin}/.*`] = {
      target,
      rewrite: (route) => {
        const rest = route.replace(new RegExp(`^/plugins/${plugin}/`), '');
        let file = rest || indexJs;
        if (file === 'index.js' && tsPlugins.includes(plugin)) {
          file = indexJs;
        }
        const pluginDir = path.posix.join(
          path.relative(root, pluginsDir),
          'node_modules',
          plugin,
        );
        if (/plugin-assets\//.test(file)) {
          return path.posix.join(pluginDir, file);
        }
        return path.posix.join(
          path.relative(root, pluginsDir),
          'node_modules',
          plugin,
          production ? 'dist' : 'src',
          file,
        );
      },
    };
  });

  const inlinePlugins = await getInlinePlugins();

  inlinePlugins.forEach((inlinePlugin) => {
    proxies[`/plugins/${inlinePlugin}/index.js`] = {
      target,
      rewrite: (route) => {
        return route.replace('index.js', 'src/index.js');
      },
    };
  });

  return proxies;
}
