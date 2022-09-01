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
export default configTest;
