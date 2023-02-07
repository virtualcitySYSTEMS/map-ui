/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import commonViteConfig from './build/commonViteConfig.js';
import getPluginProxies from './build/getPluginProxies.js';
import { determineHostFromArgv } from './build/determineHost.js';

const configMain = defineConfig(async ({ mode }) => {
  const production = mode === 'production';
  const https = false;
  const port = production ? 4173 : 8080;
  let proxy = {};
  if (!production) {
    const host = determineHostFromArgv(port, https);
    proxy = await getPluginProxies(host, production);
    proxy['/node_modules/@vcmap-cesium/engine/Build/Assets'] = {
      target: host,
      rewrite: path => path.replace(/Build/, 'Source'),
    };
  }

  const config = {
    ...commonViteConfig,
    server: {
      https,
      strictPort: true,
      port,
      proxy,
    },
  };

  if (process.env.NO_OPTIMIZED_CORE) {
    config.optimizeDeps = {
      exclude: [
        '@vcmap/core',
        'ol',
      ],
      include: [
        '@vcmap/core > fast-deep-equal',
        '@vcmap/core > rbush-knn',
        '@vcmap/core > rbush-knn > tinyqueue',
        '@vcmap/core > pbf',
        '@vcmap-cesium/engine',
      ],
    };
  }
  return config;
});

export default configMain;
