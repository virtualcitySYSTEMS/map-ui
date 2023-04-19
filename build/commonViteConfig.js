/* eslint-disable import/extensions */
import path from 'path';
import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import { libraries } from './buildHelpers.js';

const configMain = defineConfig({
  resolve: {
    alias: {
      '@vcmap/ui': `${path.resolve(process.cwd(), 'index.js')}`,
      '@cesium/engine': '@vcmap-cesium/engine',
      vue: 'vue/dist/vue.esm.js',
      tinyqueue: 'tinyqueue/tinyqueue.js',
    },
    dedupe: Object.keys(libraries),
  },
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  plugins: [createVuePlugin()],
  css: {
    preprocessorOptions: {
      sass: {
        additionalData: "\n@import './src/styles/variables.scss'\n",
      },
    },
  },
});

export default configMain;
