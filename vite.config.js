/* eslint-disable import/no-extraneous-dependencies */
import path from 'path';
import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import vitePluginComponents from 'vite-plugin-components';
import { fileURLToPath } from 'url';

const { default: ViteComponents, VuetifyResolver } = vitePluginComponents;

const dirName = path.dirname(fileURLToPath(import.meta.url));

const configMain = defineConfig({
  optimizeDeps: {
    exclude: [
      '@vcmap/core',
    ],
    include: [
      '@vcmap/core > fast-deep-equal',
      '@vcmap/core > axios',
      '@vcmap/core > rbush-knn',
      '@vcmap/core > pbf',
    ],
  },
  resolve: {
    alias: {
      '@': `${path.resolve(dirName, 'src')}`,
      '@vcsuite/uicomponents': `${path.resolve(dirName, 'components')}`,
      vue: `${path.resolve(dirName, path.join('node_modules', 'vue', 'dist', 'vue.esm.js'))}`,
    },
  },
  plugins: [
    createVuePlugin(),
    ViteComponents({
      customComponentResolvers: [
        VuetifyResolver({
          componentPrefix: '',
        }),
      ],
    }),
  ],

  server: {
    https: false,
    port: 8080,
    proxy: {
      'datasource-data': {
        target: 'https://berlin.virtualcitymap.de',
        changeOrigin: true,
      },
    },
  },
});

export default configMain;
