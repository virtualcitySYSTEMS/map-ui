/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import commonViteConfig from './build/commonViteConfig.js';

const configTest = defineConfig({
  ...commonViteConfig,
  test: {
    deps: {
      inline: ['vuetify'],
    },
    environment: 'jsdom',
    setupFiles: ['tests/setup.js'],
  },
});
// removing openlayers Alias to source, does not work in VITest.
// TODO, we should check this again with a vitest version update
delete configTest.resolve.alias.ol;

export default configTest;
