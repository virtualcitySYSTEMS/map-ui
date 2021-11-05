/* eslint-disable no-console */
export default {
  registerUiPlugin: async (config) => {
    console.log('registerUIPlugin', config);
    return {
      supportedMaps: ['vcs.vcm.maps.Cesium'],
      name: 'weather',
      routes: [],
      widgetButton: [],
    };
  },
  postInitialize: async (config) => {
    console.log('postInitialize', config);
  },
  preInitialize: async (config) => {
    console.log('preInitialize', config);
  },
  postUiInitialize: async (config) => {
    console.log('preInitialize', config);
  },
};
