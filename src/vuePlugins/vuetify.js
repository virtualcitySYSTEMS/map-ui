import '@mdi/font/css/materialdesignicons.css';
import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import { genVariations } from 'vuetify/lib/services/theme/utils.js';
import { colorToInt } from 'vuetify/lib/util/colorUtils.js';
import Icons from '../components/icons/+all.js';

Vue.use(Vuetify);

/**
 * @type {{light:string,dark:string}}
 */
export const defaultPrimaryColor = {
  light: '#409D76',
  dark: '#27B97C',
};

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
          base: {
            base: '#9E9E9E',
            lighten5: '#FFFFFF',
            lighten4: '#F8F8F8',
            lighten3: '#EBEBEB',
            lighten2: '#D0D0D0',
            lighten1: '#B8B8B8',
            darken1: '#858585',
            darken2: '#6B6B6B',
            darken3: '#525252',
            darken4: '#383838',
          },
          primary: defaultPrimaryColor.light,
          warning: '#FFCE00',
          error: '#AA0000',
          info: '#2196F3',
          success: '#4CAF50',
        },
        dark: {
          base: {
            base: '#9E9E9E',
            lighten5: '#FFFFFF',
            lighten4: '#383838',
            lighten3: '#525252',
            lighten2: '#6B6B6B',
            lighten1: '#858585',
            darken1: '#B8B8B8',
            darken2: '#D0D0D0',
            darken3: '#EBEBEB',
            darken4: '#F8F8F8',
          },
          primary: defaultPrimaryColor.dark,
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

/**
 * Returns the default primary color depending on the selected theme mode
 * @returns {string}
 */
export function getDefaultPrimaryColor() {
  if (vuetify.framework.theme.isDark) {
    return defaultPrimaryColor.dark;
  }
  return defaultPrimaryColor.light;
}

/**
 * Returns the color depending on the current theme mode
 * @param {string} value - color key, e.g. 'primary'
 * @param {string=} variant - color variant, e.g. 'lighten1', 'darken4', ...
 * @returns {string}
 */
export function getColorByKey(value, variant) {
  const mode = vuetify.framework.theme.isDark ? 'dark' : 'light';
  const color = vuetify.framework.theme.themes[mode][value];
  if (color && variant) {
    return color[variant] ?? genVariations(value, colorToInt(color))[variant];
  }
  return color?.base ?? color;
}
