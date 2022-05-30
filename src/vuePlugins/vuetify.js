import '@mdi/font/css/materialdesignicons.css';

import Vue from 'vue';
import Vuetify from 'vuetify/lib';

import Icons from '../icons/+all.js';

Vue.use(Vuetify);

const vuetify = new Vuetify({
  treeShake: false,
  defaultAssets: {
    font: {
      family: 'titillium-web',
    },
  },
  theme: {
    options: {
      customProperties: true,
    },
    themes: {
      light: {
        basic: '#FFFFFF',
        primary: '#409D76',
        accent: '#EDEDED',
        warning: '#FFCE00',
        'gray-200': '#DEDEDE',
        gray: '#707070',
        // todo: change remaining colors
        secondary: '#222222',
        error: '#AA0000',
        info: '#2196F3',
        success: '#4CAF50',
      },
      dark: {
        basic: '#000000',
        primary: '#409D76',
        secondary: '#FFFFFF',
        accent: '#757575',
        warning: '#FFCE00',
        error: '#FF5252',
      },
    },
  },
  icons: {
    iconfont: 'mdi',
    values: {
      ...Icons,
    },
  },
});

// eslint-disable-next-line import/prefer-default-export
export { vuetify };
