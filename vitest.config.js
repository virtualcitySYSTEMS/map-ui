/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import Components from 'unplugin-vue-components/vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';

const configTest = defineConfig({
  plugins: [
    createVuePlugin(),
    Components({
      resolvers: [
        VuetifyResolver(),
      ],
      dirs: ['src'],
      include: ['node_modules/vuetify'],
      exclude: [],
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.js'],
    // globalSetup: 'tests/global.js',
  },
});

export default configTest;
