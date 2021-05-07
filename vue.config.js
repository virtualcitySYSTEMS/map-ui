/* eslint-disable */
const { join } = require('path')

module.exports = {
  transpileDependencies: ['vuetify'],
  pluginOptions: {
    webpackBundleAnalyzer: {
      openAnalyzer: false,
    },
  },
  configureWebpack: {
    entry: ['./src/main.js'],
    resolve: {
      extensions: ['.js', '.vue', '.json'],
      alias: {
          '@': join(__dirname, '/src'),
          '@vcsuite/uicomponents': join(__dirname, '/components')
      }
    },
  },
  chainWebpack: (config) => {
    const svgRule = config.module.rule('svg');

    svgRule.uses.clear();

    svgRule
      .oneOf('inline')
      .resourceQuery(/inline/)
      .use('babel-loader')
      .loader('babel-loader')
      .end()
      .use('vue-svg-loader')
      .loader('vue-svg-loader')
      .end()
      .end()
      .oneOf('external')
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: 'assets/[name].[hash:8].[ext]',
      });
  },
  devServer: {
    contentBase: __dirname,
  },
};
