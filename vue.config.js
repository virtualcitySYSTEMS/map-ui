// eslint-disable-next-line import/no-extraneous-dependencies
const { join } = require('path');

module.exports = {
  lintOnSave: false,
  indexPath: 'public/index.html',
  transpileDependencies: ['vuetify'],
  pluginOptions: {
    webpackBundleAnalyzer: {
      openAnalyzer: false,
    },
  },
  configureWebpack: {
    experiments: {
      outputModule: true,
    },
    entry: {
      app: './src/main.js',
    },
    resolve: {
      extensions: ['.js', '.vue', '.json'],
      alias: {
        '@': join(__dirname, '/src'),
        '@vcsuite/uicomponents': join(__dirname, '/components'),
      },
    },
    output: {
      filename: '[name].js',
      library: {
        type: 'module',
      },
      module: true,
    },
  },
  chainWebpack: (config) => {
    const svgRule = config.module.rule('svg');
    config.plugin('html')
      .tap((args) => {
        args[0].inject = false;
        return args;
      });


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
    proxy: {
      'datasource-data': {
        target: 'https://berlin.virtualcitymap.de',
        changeOrigin: true,
      },
    },
    watchOptions: {
      ignored: /\.(idea|git)/,
    },
  },
};
