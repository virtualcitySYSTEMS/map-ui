/* eslint-disable import/no-extraneous-dependencies */
import path from 'path';
import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import ViteComponents, {
  VuetifyResolver,
} from 'vite-plugin-components';

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
      '@': `${path.resolve(__dirname, 'src')}`,
      '@vcsuite/uicomponents': `${path.resolve(__dirname, 'components')}`,
      vue: `${path.resolve(__dirname, path.join('node_modules', 'vue', 'dist', 'vue.esm.js'))}`,
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
