import { existsSync } from 'node:fs';
import { defineConfig } from 'vite';
import vue3 from '@vitejs/plugin-vue';
import { transformAssetUrls } from 'vite-plugin-vuetify';
import { getProjectPath, libraries } from './buildHelpers.js';

const configMain = defineConfig({
  resolve: {
    alias: {
      '@vcmap/ui': existsSync(getProjectPath('index.ts'))
        ? getProjectPath('index.ts')
        : getProjectPath('lib', 'index.js'),
      '@cesium/engine': '@vcmap-cesium/engine',
      tinyqueue: 'tinyqueue/tinyqueue.js',
    },
    dedupe: Object.keys(libraries),
  },

  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.VITE_LOGGER_ENABLED': 'false',
  },
  plugins: [vue3({ template: { transformAssetUrls } })],
});

export default configMain;
