import { defineConfig } from 'vite';
import { HstVue as hstVue } from '@histoire/plugin-vue';
import { join, resolve, dirname } from 'node:path';
import { lstat, readlink } from 'node:fs/promises';
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
      rewrite: (path) => path.replace(/Build/, 'Source'),
    };
    proxy['/node_modules/@vcmap-cesium/engine/Build/ThirdParty'] = {
      target: host,
      rewrite: (path) => path.replace(/Build/, 'Source'),
    };
    proxy['/node_modules/.vite/workers'] = {
      target: host,
      rewrite: (path) =>
        path.replace(/\/\.vite\/workers/, '/@vcmap/core/dist/src/workers'),
    };
  } else {
    const pluginRegistryIndex = process.argv.indexOf('--plugin-registry');
    if (pluginRegistryIndex > -1 && process.argv[pluginRegistryIndex + 1]) {
      proxy['/plugins'] = {
        target: process.argv[pluginRegistryIndex + 1],
        rewrite: (path) => path.replace(/plugins/, 'map-plugin'),
      };
    }
  }

  const modules = [];
  process.argv.forEach((arg, index, args) => {
    if (arg === '--module' && index < args.length) {
      modules.push(args[index + 1]);
    }
  });

  if (modules.length) {
    proxy['/app.config.json'] = {
      target: 'vc.systems',
      selfHandleResponse: true,
      configure(server) {
        server.on('proxyReq', (proxyRes, req, res) => {
          res.write(JSON.stringify({ modules }));
          res.end();
        });
      },
    };
  }

  // we need to ensure that we still serve web-workers, even if the core is symlinked
  let fs;
  const coreModule = join(process.cwd(), 'node_modules', '@vcmap', 'core');
  const coreStats = await lstat(coreModule);
  if (coreStats.isSymbolicLink()) {
    const linkPath = await readlink(coreModule);
    fs = {
      allow: [
        '.',
        resolve(dirname(coreModule), join(linkPath, 'dist', 'src', 'workers')),
      ],
    };
  } else {
    fs = {
      allow: [
        '.',
        resolve(dirname(coreModule), join('dist', 'src', 'workers')),
      ],
    };
  }

  const config = {
    ...commonViteConfig,
    server: {
      https,
      strictPort: true,
      port,
      proxy,
      fs,
    },
    optimizeDeps: {
      include: ['vuetify'],
    },
    histoire: {
      plugins: [hstVue()],
      setupFile: {
        browser: './story/setup.js',
      },
      viteNodeInlineDeps: ['uuid'],
      vite: {
        base: process.env.HISTOIRE_DEPLOYMENT
          ? process.env.HISTOIRE_DEPLOYMENT
          : './',
        server: {
          host: process.argv.includes('--host'),
        },
      },
    },
  };

  if (process.env.NO_OPTIMIZED_CORE) {
    config.optimizeDeps = {
      exclude: ['@vcmap/core', 'ol'],
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
