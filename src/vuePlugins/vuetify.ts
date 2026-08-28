/* eslint-disable @typescript-eslint/naming-convention */
import type { IconProps, IconSet, VuetifyOptions } from 'vuetify';
import { createVuetify, useDisplay, useTheme } from 'vuetify';
import { VSvgIcon } from 'vuetify/components';
import type { I18n } from 'vue-i18n';
import { useI18n } from 'vue-i18n';
import 'vuetify/styles';
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n';
import type { ComputedRef, VNode } from 'vue';
import { computed, h } from 'vue';
import DOMPurify from 'dompurify';
import type VcsUiApp from '../vcsUiApp.js';
import Icons from '../components/icons/+all.js';

export const defaultPrimaryColor = {
  light: '#409D76',
  dark: '#27B97C',
};

type VcsColors = {
  base?: string;
  'base-lighten-5'?: string;
  'base-lighten-4'?: string;
  'base-lighten-3'?: string;
  'base-lighten-2'?: string;
  'base-lighten-1'?: string;
  'base-darken-1'?: string;
  'base-darken-2'?: string;
  'base-darken-3'?: string;
  'base-darken-4'?: string;
  primary?: string;
  warning?: string;
  error?: string;
  info?: string;
  success?: string;
  'surface-light'?: string;
};

type VcsVariables = {
  'hover-opacity'?: string;
  'high-emphasis-opacity'?: string;
  'medium-emphasis-opacity'?: string;
  'vcs-font-size'?: string;
  'vcs-font-family'?: string;
  'active-opacity'?: string;
  'activated-opacity'?: string;
  'list-item-subtitle-opacity'?: string;
};

type VcsTheme = {
  colors?: VcsColors;
  variables?: VcsVariables;
};

export type VcsThemes = {
  dark?: VcsTheme;
  light?: VcsTheme;
};

export function createVcsThemes(
  options?: VcsThemes,
  primaryColor?: { dark: string; light: string } | string,
): VcsThemes {
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

  const lightPrimary =
    typeof primaryColor === 'string'
      ? primaryColor
      : (primaryColor?.light ?? defaultPrimaryColor.light);
  const darkPrimary =
    typeof primaryColor === 'string'
      ? primaryColor
      : (primaryColor?.dark ?? defaultPrimaryColor.dark);

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
        primary: lightPrimary,
        warning: '#FFCE00',
        error: '#AA0000',
        info: '#2196F3',
        success: '#4CAF50',
        'surface-light': '#ffffff',
        ...options?.light?.colors,
      },
      variables: {
        'activated-opacity': '0.04',
        'hover-opacity': ' 0.16',
        'high-emphasis-opacity': '1',
        'medium-emphasis-opacity': '1',
        'list-item-subtitle-opacity': '0.6',
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
        primary: darkPrimary,
        warning: '#FFCE00',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        'surface-light': '#222222',
        ...options?.dark?.colors,
      },
      variables: {
        'active-opacity': ' 0.04',
        'hover-opacity': '0.16',
        'high-emphasis-opacity': '1',
        'medium-emphasis-opacity': '1',
        'list-item-subtitle-opacity': '0.6',
        'vcs-font-family': 'Titillium Web',
        ...options?.dark?.variables,
        'vcs-font-size': fontSizeDark,
      },
    },
  };
}

export function setTheme(
  vuetify: ReturnType<typeof createVuetify>,
  theme: VcsThemes,
): void {
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

const imageUrlSet: IconSet = {
  component: (props: IconProps): VNode => {
    const icon = typeof props.icon === 'string' ? props.icon : '';
    return h(
      props.tag,
      h('img', {
        src: icon,
        alt: 'custom icon',
        style: { width: 'auto', height: '100%' },
      }),
    );
  },
};

const svgStringSet: IconSet = {
  component: (props: IconProps): VNode => {
    if (typeof props.icon !== 'string') {
      return h(props.tag);
    }

    const svg = new DOMParser()
      .parseFromString(DOMPurify.sanitize(props.icon), 'image/svg+xml')
      .querySelector('svg');
    svg?.classList.add('v-icon__svg');
    return h(props.tag, {
      innerHTML: svg?.outerHTML,
    });
  },
};

const svgPathDataSet: IconSet = {
  component: VSvgIcon,
};

export function createVcsVuetify(i18n: I18n): ReturnType<typeof createVuetify> {
  const dark =
    window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;

  const isTouchDevice =
    'ontouchstart' in (window || {}) || navigator?.maxTouchPoints > 0 || false;
  // Check if the screen is large enough to display tooltips (Issue: large tablets don't fall in this screen size and will display tooltips)
  const isLargeScreen =
    window.matchMedia?.('(min-width: 960px)')?.matches ?? true;

  const allowTooltip = isLargeScreen || !isTouchDevice;

  const theme: VuetifyOptions['theme'] = {
    cspNonce: window.vcs?.styleNonce,
    themes: createVcsThemes(),
    variations: { colors: ['primary'], lighten: 5, darken: 5 },
    ...(dark ? { defaultTheme: 'dark' } : undefined),
  };

  return createVuetify({
    defaults: {
      VBtn: {
        class: 'text-uppercase',
        style: { 'letter-spacing': '.0892857143em' },
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
    theme,
    icons: {
      aliases: { ...Icons },
      sets: {
        imageUrl: imageUrlSet,
        svgString: svgStringSet,
        svgPathData: svgPathDataSet,
      },
    },
    locale: { adapter: createVueI18nAdapter({ i18n, useI18n }) },
  });
}

export function isDark(app: VcsUiApp): boolean {
  return app.vuetify.theme.current.value.dark;
}

/**
 * Returns the default primary color depending on the selected theme mode
 */
export function getDefaultPrimaryColor(app: VcsUiApp): string {
  if (isDark(app)) {
    return defaultPrimaryColor.dark;
  }
  return defaultPrimaryColor.light;
}

/**
 * Returns the color depending on the current theme mode
 * @param value - color key, e.g. 'primary'
 * @param variant - color variant, e.g. 'lighten-1', 'darken-4', ...
 */
export function getColorByKey(
  app: VcsUiApp,
  value: string,
  variant?: string,
): string {
  let key = value;
  if (variant) {
    key = `${value}-${variant}`;
  }
  return app.vuetify.theme.current.value.colors[key] as string;
}

/**
 * returns the fontSize as a number
 */
export function useFontSize(): ComputedRef<number> {
  const theme = useTheme();
  return computed(() => {
    const fontSize = theme.current.value.variables['vcs-font-size'] ?? '13';
    // get rid of `px`
    return Number.parseFloat(String(fontSize));
  });
}

/**
 * @returns A computed reference indicating if the device is a mobile platform in landscape mode.
 */
export function isMobileLandscape(): ComputedRef<boolean> {
  const display = useDisplay();
  return computed(() => {
    // Check if the device is a mobile platform (e.g., Android, iOS)
    const isMobilePlatform =
      display.platform.value.android || display.platform.value.ios;

    // Check if the device height is less than the threshold for SM
    const isHeightXs = display.height.value <= display.thresholds.value.sm;

    // Check if the device is in landscape mode
    const isLandscape = display.height.value < display.width.value;

    return isMobilePlatform && isLandscape && isHeightXs;
  });
}

/**
 * returns the default IconSize as a number, value is based on the fontSize
 */
export function useIconSize(): ComputedRef<number> {
  const fontSize = useFontSize();
  return computed(() => fontSize.value * (1.2 + 0.1 / 3));
}
