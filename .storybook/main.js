const path = require('path');

module.exports = {
  "stories": [
    "../components/stories/**/*.stories.mdx",
    "../components/stories/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-docs",
  ],
  webpackFinal: async (config, { configType }) => {

    config.module.rules.push({
      test: /\.s(a|c)ss$/,
      use: ['style-loader', 'css-loader', 'sass-loader'],
      include: path.resolve(__dirname, '../'),
    });

    config.module.rules.push({
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../src'),
          '@vcsuite/uicomponents': path.resolve(__dirname, '../components'),
          vue: 'vue/dist/vue.js',
          'vue$': 'vue/dist/vue.esm.js',          
        },
      },
    });

    return config;
  },
}