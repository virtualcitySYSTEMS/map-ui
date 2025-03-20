import { createVuetify, useDisplay, useTheme } from 'vuetify';
import { VSvgIcon } from 'vuetify/components';
import { useI18n } from 'vue-i18n';
import 'vuetify/styles';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import { computed, h } from 'vue';
import DOMPurify from 'dompurify';
import Icons from '../components/icons/+all.js';

/**
 * @type {{light:string,dark:string}}
 */
export const defaultPrimaryColor = {
  light: '#409D76',
  dark: '#27B97C',
};

/**
 * @typedef {Object} VcsColors
 * @property {string} [base]
 * @property {string} [base-lighten-5]
 * @property {string} [base-lighten-4]
 * @property {string} [base-lighten-3]
 * @property {string} [base-lighten-2]
 * @property {string} [base-lighten-1]
 * @property {string} [base-darken-1]
 * @property {string} [base-darken-2]
 * @property {string} [base-darken-3]
 * @property {string} [base-darken-4]
 * @property {string} [primary]
 * @property {string} [warning]
 * @property {string} [error]
 * @property {string} [info]
 * @property {string} [success]
 * @property {string} [surface-light]
 */

/**
 * @typedef {Object} VcsVariables
 * @property {string} [hover-opacity]
 * @property {string} [high-emphasis-opacity]
 * @property {string} [medium-emphasis-opacity]
 * @property {string} [vcs-font-size]
 * @property {string} [vcs-font-family]
 */

/**
 * @typedef {Object} VcsTheme
 * @property {VcsColors} [colors]
 * @property {VcsVariables} [variables]
 */

/**
 * @typedef {Object} VcsThemes
 * @property {VcsTheme} [dark]
 * @property {VcsTheme} [light]
 */

/**
 * @param {VcsThemes} [options]
 * @param {{ dark:string, light:string }|string} [primaryColor]
 * @returns {VcsThemes}
 */
export function createVcsThemes(options, primaryColor) {
  const isTouchDevice =
    'ontouchstart' in (window || {}) || navigator?.maxTouchPoints > 0 || false;
  const isSmallerScreen =
    window.matchMedia?.('(max-width: 600px)')?.matches ?? false;

  const isPhone = isSmallerScreen && isTouchDevice;
  let fontSizeLight = options?.light?.variables?.['vcs-font-size'] || '13px';
  let fontSizeDark = options?.dark?.variables?.['vcs-font-size'] || '13px';

  if (isPhone) {
    fontSizeLight = `${parseInt(fontSizeLight, 10) + 1}px`;
    fontSizeDark = `${parseInt(fontSizeDark, 10) + 1}px`;
  }
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
        primary:
          primaryColor?.dark ?? primaryColor ?? defaultPrimaryColor.light,
        warning: '#FFCE00',
        error: '#AA0000',
        info: '#2196F3',
        success: '#4CAF50',
        'surface-light': '#ffffff',
        ...options?.light?.colors,
      },
      variables: {
        'activated-opacity': 0.04,
        'hover-opacity': 0.16,
        'high-emphasis-opacity': 1,
        'medium-emphasis-opacity': 1,
        'list-item-subtitle-opacity': 0.6,
        'vcs-font-family': 'Titillium Web',
        ...options?.light?.variables,
        'vcs-font-size': fontSizeLight,
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
        primary: primaryColor?.dark ?? primaryColor ?? defaultPrimaryColor.dark,
        warning: '#FFCE00',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        'surface-light': '#222222',
        ...options?.dark?.colors,
      },
      variables: {
        'active-opacity': 0.04,
        'hover-opacity': 0.16,
        'high-emphasis-opacity': 1,
        'medium-emphasis-opacity': 1,
        'list-item-subtitle-opacity': 0.6,
        'vcs-font-family': 'Titillium Web',
        ...options?.dark?.variables,
        'vcs-font-size': fontSizeDark,
      },
    },
  };
}

/**
 * @param {ReturnType<typeof import("vuetify").createVuetify>} vuetify
 * @param {VcsThemes} theme
 */
export function setTheme(vuetify, theme) {
  Object.assign(vuetify.theme.themes.value.light.colors, theme?.light?.colors);
  Object.assign(
    vuetify.theme.themes.value.light.variables,
    theme?.light?.variables,
  );
  Object.assign(vuetify.theme.themes.value.dark.colors, theme?.dark?.colors);
  Object.assign(
    vuetify.theme.themes.value.dark.variables,
    theme?.dark?.variables,
  );
}

const imageUrlSet = {
  component: (props) =>
    h(
      props.tag,
      h('img', {
        src: props.icon,
        alt: 'custom icon',
        style: { width: 'auto', height: '100%' },
      }),
    ),
};

const svgStringSet = {
  component: (props) => {
    const svg = new DOMParser()
      .parseFromString(DOMPurify.sanitize(props.icon), 'image/svg+xml')
      .querySelector('svg');
    svg?.classList.add('v-icon__svg');
    return h(props.tag, {
      innerHTML: svg?.outerHTML,
    });
  },
};

const svgPathDataSet = {
  component: VSvgIcon,
};

/**
 * @param {import("vue-i18n").I18n} i18n
 * @returns {ReturnType<typeof import("vuetify").createVuetify>}
 */
export function createVcsVuetify(i18n) {
  const dark =
    window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;

  const isTouchDevice =
    'ontouchstart' in (window || {}) || navigator?.maxTouchPoints > 0 || false;
  // Check if the screen is large enough to display tooltips (Issue: large tablets don't fall in this screen size and will display tooltips)
  const isLargeScreen =
    window.matchMedia?.('(min-width: 960px)')?.matches ?? true;

  const allowTooltip = isLargeScreen || !isTouchDevice;

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
      VBtn: {
        ripple: false,
      },
      VList: {
        density: 'compact',
        class: 'pa-0 vcsList',
      },
      VListItem: {
        density: 'compact',
        ripple: false,
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
      VTextarea: {
        density: 'compact',
      },
      VCheckbox: {
        density: 'compact',
        ripple: false,
      },
      VDataTable: {
        density: 'compact',
      },
      VSelect: {
        density: 'compact',
      },
      VSlider: {
        density: 'compact',
        ripple: false,
      },
      VSwitch: {
        density: 'compact',
        ripple: false,
      },
      VColorPicker: {
        elevation: 0,
        tile: true,
      },
      VExpansionPanel: {
        ripple: false,
        elevation: 0,
        tile: true,
      },
      VTooltip: {
        openOnHover: allowTooltip,
        maxWidth: 480,
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
      sets: {
        imageUrl: imageUrlSet,
        svgString: svgStringSet,
        svgPathData: svgPathDataSet,
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
 * returns the fontSize as a number
 * @returns {import("vue").ComputedRef<number>}
 */
export function useFontSize() {
  const theme = useTheme();
  return computed(() => {
    const fontSize = theme.current.value.variables['vcs-font-size'] ?? 13;
    // get rid of `px`
    return Number.parseFloat(fontSize);
  });
}

/**
 * @returns {import("vue").ComputedRef<boolean>} - A computed reference indicating if the device is a mobile platform in landscape mode.
 */
export function isMobileLandscape() {
  const display = useDisplay();
  return computed(() => {
    // Check if the device is a mobile platform (e.g., Android, iOS, or touch-based)
    const isMobilePlatform =
      display.platform.value.android ||
      display.platform.value.ios ||
      display.platform.value.touch;

    // Check if the device height is less than the threshold for SM
    const isHeightXs = display.height.value <= display.thresholds.value.sm;

    // Check if the device is in landscape mode
    const isLandscape = display.height.value < display.width.value;

    return isMobilePlatform && isLandscape && isHeightXs;
  });
}

/**
 * returns the default IconSize as a number, value is based on the fontSize
 * @returns {import("vue").ComputedRef<number>}
 */
export function useIconSize() {
  const fontSize = useFontSize();
  return computed(() => {
    return fontSize.value * (1.2 + 0.1 / 3);
  });
}
