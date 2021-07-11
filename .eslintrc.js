module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['@vcsuite/eslint-config/vue'],
  plugins: ['jsdoc'],
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './src'],
          ['@vcsuite/uicomponents', './components'],
        ],
      },
    },
  },
  rules: {
    'jsdoc/check-tag-names': 'off',
  },
  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
        '**/tests/unit/**/*.spec.{j,t}s?(x)',
      ],
      env: {
        mocha: true,
      },
    },
  ],
};
