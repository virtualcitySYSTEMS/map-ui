import '@mdi/font/css/materialdesignicons.css';

import Vue from 'vue';
import Vuetify from 'vuetify';

import Icons from '@vcsuite/uicomponents/icons/+all';

Vue.use(Vuetify);

const vuetify = new Vuetify({
  treeShake: true,
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
        primary: '#409D76',
        accent: '#EDEDED',
        warning: '#FFCE00',
        'gray-200': '#DEDEDE',
        gray: '#707070',
        // todo: change remaining colors
        secondary: '#424242',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
      },
      dark: {
        primary: '#409D76',
        accent: '#757575',
        warning: '#FFCE00',
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
