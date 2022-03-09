/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import commonViteConfig from './build/commonViteConfig.js';

const configMain = defineConfig({
  ...commonViteConfig,
  optimizeDeps: {
    exclude: [
      '@vcmap/core',
      'ol',
      '@vcsuite/ui-components',
    ],
    include: [
      '@vcmap/core > fast-deep-equal',
      '@vcmap/core > rbush-knn',
      '@vcmap/core > pbf',
      'ol > pbf',
      '@vcmap/cesium',
    ],
  },
  server: {
    https: false,
    port: 8080,
    proxy: {
      'datasource-data': {
        target: 'https://berlin.virtualcitymap.de',
        changeOrigin: true,
      },
    },
  }
});

export default configMain;
