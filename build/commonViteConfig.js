/* eslint-disable import/extensions */
import path from 'path';
import { defineConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import Components from 'unplugin-vue-components/vite';
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import { libraries } from './buildHelpers.js';

const configMain = defineConfig({
  resolve: {
    alias: {
      '@vcmap/ui': `${path.resolve(process.cwd(), 'index.js')}`,
      vue: 'vue/dist/vue.esm.js',
      tinyqueue: 'tinyqueue/tinyqueue.js',
    },
    dedupe: Object.keys(libraries),
    preserveSymlinks: false,
  },
  plugins: [
    createVuePlugin(),
    Components({
      resolvers: [
        VuetifyResolver(),
      ],
      dirs: ['src'],
      include: [],
      exclude: [],
    }),
  ],
  css: {
    preprocessorOptions: {
      sass: {
        additionalData: "\n@import './node_modules/@vcsuite/ui-components/src/styles/variables.scss'\n",
      },
    },
  },
});

export default configMain;
