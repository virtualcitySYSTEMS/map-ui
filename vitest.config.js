import { defineConfig } from 'vite';
import commonViteConfig from './build/commonViteConfig.js';

const configTest = defineConfig({
  ...commonViteConfig,
  test: {
    server: { deps: { inline: ['vuetify'] } },
    css: false,
    clearMocks: false,
    environment: 'jsdom',
    setupFiles: ['tests/setup.js'],
    pool: 'forks',
  },
});
export default configTest;
