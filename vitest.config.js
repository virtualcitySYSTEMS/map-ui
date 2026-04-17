import { defineConfig } from 'vite';
import commonViteConfig from './build/commonViteConfig.js';

const configTest = defineConfig({
  ...commonViteConfig,
  test: {
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    css: true,
    environment: 'jsdom',
    setupFiles: ['tests/setup.js'],
    pool: 'forks',
  },
});
export default configTest;
