/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import Components from 'unplugin-vue-components/vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import { VuetifyResolver } from 'unplugin-vue-components/resolvers';
import path from 'path';

const configTest = defineConfig({
  resolve: {
    alias: {
      '@vcmap/ui': `${path.resolve(process.cwd(), 'index.js')}`,
    },
  },
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
    deps: {
      inline: [/@vcsuite\/ui-components/, 'vuetify'],
    },
    environment: 'jsdom',
    setupFiles: ['tests/setup.js'],
  },
});

export default configTest;
