import { computed } from 'vue';
import VcsDefaultLogoMobile from '../logo-mobile.svg';

/**
 * Creates a computed property for data protection configuration.
 * @param {import("../uiConfig.js").UiConfigObject} uiConfig - The UI configuration object from the app.
 * @returns {import('vue').ComputedRef<import('../uiConfig.js').TextPageType|undefined>}
 */
export function getDataProtection(uiConfig) {
  return computed(() => {
    if (uiConfig?.dataProtection) {
      return {
        title: 'footer.dataProtection.title',
        tooltip: 'footer.dataProtection.tooltip',
        ...uiConfig.dataProtection,
      };
    }
    return undefined;
  });
}

/**
 * Creates a computed property for imprint configuration.
 * @param {import("../uiConfig.js").UiConfigObject} uiConfig - The UI configuration object from the app.
 * @returns {import('vue').ComputedRef<import('../uiConfig.js').TextPageType|undefined>}
 */
export function getImprint(uiConfig) {
  return computed(() => {
    if (uiConfig?.imprint) {
      return {
        title: 'footer.imprint.title',
        tooltip: 'footer.imprint.tooltip',
        ...uiConfig.imprint,
      };
    }
    return undefined;
  });
}

/**
 * Creates a computed property for mobile logo.
 * @param {import("../vcsUiApp.js").default} app - The VcsUiApp.
 * @returns {import('vue').ComputedRef<string>}
 */
export function getMobileLogo(app) {
  return computed(() => {
    const { config } = app.uiConfig;
    const isDark = app.vuetify.theme.current.value.dark;

    return isDark
      ? (config.mobileLogoDark ??
          config.logoDark ??
          config.mobileLogo ??
          config.logo ??
          VcsDefaultLogoMobile)
      : (config.mobileLogo ?? config.logo ?? VcsDefaultLogoMobile);
  });
}
