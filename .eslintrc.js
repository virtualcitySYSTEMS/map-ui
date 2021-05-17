module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ['@vcsuite/eslint-config/vue'],
  plugins: ['jsdoc'],
  settings: {
    'import/resolver': {
      webpack: {
        config: require.resolve('@vue/cli-service/webpack.config.js'),
      },
    },
  },
  rules: {
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
      },
    ],
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
