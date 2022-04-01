import path from 'path';
import { getPluginDirectory, getPluginNames } from './buildHelpers.js';

/**
 * Determines the proxy setting to serve plugins referrenced in the package.json in the plugins directory
 * @param {string} [target=http://localhost:8080]
 * @param {boolean} [production=false]
 * @returns {Promise<Record<string, string | import("vite").ProxyOptions>>}
 */
export default async function getPluginProxies(target = 'http://localhost:8080', production = false) {
  const root = process.cwd();
  const pluginsDir = getPluginDirectory();
  const plugins = await getPluginNames();
  const proxies = {};

  plugins.forEach((plugin) => {
    proxies[`^/plugins/${plugin}/.*`] = {
      target,
      rewrite: (route) => {
        const rest = route.replace(new RegExp(`^/plugins/${plugin}/`), '');
        const file = rest || 'index.js';
        return path.posix.join(path.relative(root, pluginsDir), 'node_modules', plugin, production ? 'dist' : 'src', file);
      },
    };
  });

  return proxies;
}
