import '@mdi/font/css/materialdesignicons.css';
import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import Icons from '../components/icons/+all.js';

Vue.use(Vuetify);

/**
 * @type {string}
 */
export const defaultPrimaryColor = '#409D76';

/**
 * @returns {import("vuetify").default}
 */
export function createVuetify() {
  return new Vuetify({
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
          primary: defaultPrimaryColor,
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
          primary: defaultPrimaryColor,
          secondary: '#FFFFFF',
          accent: '#757575',
          warning: '#FFCE00',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
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
}

/**
 * @type {import("vuetify").default}
 */
export const vuetify = createVuetify();
