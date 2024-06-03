/* eslint-disable import/extensions */
import path from 'path';
import { defineConfig } from 'vite';
import vue3 from '@vitejs/plugin-vue';
import { transformAssetUrls } from 'vite-plugin-vuetify';
import { libraries } from './buildHelpers.js';

const configMain = defineConfig({
  resolve: {
    alias: {
      '@vcmap/ui': `${path.resolve(process.cwd(), 'index.js')}`,
      '@cesium/engine': '@vcmap-cesium/engine',
      tinyqueue: 'tinyqueue/tinyqueue.js',
    },
    dedupe: Object.keys(libraries),
  },
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  plugins: [
    vue3({
      template: { transformAssetUrls },
    }),
  ],
});

export default configMain;
