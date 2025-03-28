import { configs } from '@vcsuite/eslint-config';

export default [
  ...configs.vue,
  {
    ignores: [
      'node_modules/',
      '**/*.d.ts',
      'dist/',
      'exampleData/',
      '.histoire/',
      'lib/',
      'coverage/',
      'docs/',
      '**/*timestamp-*.mjs',
    ],
  },
  {
    settings: {
      'import/resolver': {
        alias: {
          map: [['@vcmap/ui', './index.js']],
        },
      },
    },
    rules: {
      'vue/no-v-model-argument': 'off',
      'jsdoc/check-tag-names': 'off',
      'vue/attributes-order': 'off',
    },
  },
  {
    files: ['build/*.js', 'vite.config.js', 'vitest.config.js'],
    rules: {
      'import/no-unresolved': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['plugins/**/*.js', 'plugins/**/*.vue'],
    rules: {
      'import/no-extraneous-dependencies': 'off',
      'import/no-unresolved': 'off',
      'no-console': 'off',
      'no-alert': 'off',
    },
  },
];
