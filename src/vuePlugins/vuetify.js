import { createVuetify, useTheme } from 'vuetify';
import { useI18n } from 'vue-i18n';
import 'vuetify/styles';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import { computed } from 'vue';
import Icons from '../components/icons/+all.js';

/**
 * @type {{light:string,dark:string}}
 */
export const defaultPrimaryColor = {
  light: '#409D76',
  dark: '#27B97C',
};

export function createVcsThemes() {
  return {
    light: {
      colors: {
        base: '#9E9E9E',
        'base-lighten-5': '#FFFFFF',
        'base-lighten-4': '#F8F8F8',
        'base-lighten-3': '#EBEBEB',
        'base-lighten-2': '#D0D0D0',
        'base-lighten-1': '#B8B8B8',
        'base-darken-1': '#858585',
        'base-darken-2': '#6B6B6B',
        'base-darken-3': '#525252',
        'base-darken-4': '#383838',
        primary: defaultPrimaryColor.light,
        warning: '#FFCE00',
        error: '#AA0000',
        info: '#2196F3',
        success: '#4CAF50',
        'surface-light': '#ffffff',
      },
      variables: {
        'hover-opacity': 0.16,
        'high-emphasis-opacity': 1,
        'medium-emphasis-opacity': 1,
        'vcs-item-height': '32px',
        'vcs-font-size': '13px',
        'vcs-font-family': 'Titillium Web',
      },
    },
    dark: {
      colors: {
        base: '#9E9E9E',
        'base-lighten-5': '#FFFFFF',
        'base-lighten-4': '#383838',
        'base-lighten-3': '#525252',
        'base-lighten-2': '#6B6B6B',
        'base-lighten-1': '#858585',
        'base-darken-1': '#B8B8B8',
        'base-darken-2': '#D0D0D0',
        'base-darken-3': '#EBEBEB',
        'base-darken-4': '#F8F8F8',
        primary: defaultPrimaryColor.dark,
        warning: '#FFCE00',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        'surface-light': '#222222',
      },
      variables: {
        'hover-opacity': 0.16,
        'vcs-item-height': '40px',
        'vcs-font-size': '15px',
        'vcs-font-family': 'Titillium Web',
      },
    },
  };
}

/**
 * @param {import("vue-i18n").I18n} i18n
 * @returns {ReturnType<typeof import("vuetify").createVuetify>}
 */
export function createVcsVuetify(i18n) {
  const dark =
    window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;

  const theme = {
    options: {
      customProperties: true,
    },
    themes: createVcsThemes(),
    variations: {
      colors: ['primary'],
      lighten: 5,
      darken: 5,
    },
  };
  if (dark) {
    theme.defaultTheme = 'dark';
  }

  return createVuetify({
    treeShake: false,
    defaults: {
      VIcon: {
        size: 16,
      },
      VList: {
        class: 'pa-0',
      },
      VListItem: {
        density: 'compact',
        minHeight: 32,
      },
      VRadio: {
        density: 'compact',
        ripple: false,
      },
      VRadioGroup: {
        density: 'compact',
        ripple: false,
      },
      VTextField: {
        density: 'compact',
      },
      VFileInput: {
        density: 'compact',
      },
      VCheckbox: {
        density: 'compact',
        ripple: false,
      },
    },
    defaultAssets: {
      font: {
        family: 'titillium-web',
      },
    },
    theme,
    icons: {
      aliases: {
        ...Icons,
      },
    },
    locale: {
      adapter: createVueI18nAdapter({ i18n, useI18n }),
    },
  });
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @returns {boolean}
 */
export function isDark(app) {
  return app.vuetify.theme.current.value.dark;
}

/**
 * Returns the default primary color depending on the selected theme mode
 * @param {import("../vcsUiApp.js").default} app
 * @returns {string}
 */
export function getDefaultPrimaryColor(app) {
  if (isDark(app)) {
    return defaultPrimaryColor.dark;
  }
  return defaultPrimaryColor.light;
}

/**
 * Returns the color depending on the current theme mode
 * @param {import("../vcsUiApp.js").default} app
 * @param {string} value - color key, e.g. 'primary'
 * @param {string=} variant - color variant, e.g. 'lighten-1', 'darken-4', ...
 * @returns {string}
 */
export function getColorByKey(app, value, variant) {
  let key = value;
  if (variant) {
    key = `${value}-${variant}`;
  }
  return app.vuetify.theme.current.value.colors[key];
}

/**
 * returns the itemHeight as a number
 * @returns {import("vue").ComputedRef<number>}
 */
export function useItemHeight() {
  const theme = useTheme();
  return computed(() => {
    const itemHeight = theme.current.value.variables['vcs-item-height'] ?? 32;
    // get rid of `px`
    return Number.parseFloat(itemHeight);
  });
}
