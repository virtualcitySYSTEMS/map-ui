import { getLogger } from '@vcsuite/logger';
import type { ComputedRef } from 'vue';
import { computed } from 'vue';
import type VcsUiApp from '../vcsUiApp.js';
import type { TextPageType, UiConfigObject } from '../uiConfig.js';

/**
 * Creates a computed property for data protection configuration.
 * @param uiConfig - The UI configuration object from the app.
 */
export function getDataProtection(
  uiConfig: UiConfigObject,
): ComputedRef<TextPageType | undefined> {
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
 * @param uiConfig - The UI configuration object from the app.
 */
export function getImprint(
  uiConfig: UiConfigObject,
): ComputedRef<TextPageType | undefined> {
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
 * Creates a computed property for additional footer information configuration.
 * @param uiConfig - The UI configuration object from the app.
 */
export function getFooterInformation(
  uiConfig: UiConfigObject,
): ComputedRef<TextPageType[] | undefined> {
  return computed(() => {
    if (uiConfig?.footerInformation) {
      return uiConfig.footerInformation
        .filter((info) => {
          if (!info.title && !info.url) {
            getLogger('uiConfigHelper').warning(
              'Footer information item skipped, missing title or url',
              info,
            );
            return false;
          }
          return true;
        })
        .map((info) => ({
          title:
            info.title ||
            (info.url ? new URL(info.url, window.location.href).hostname : ''),
          ...info,
        }));
    }
    return undefined;
  });
}

/**
 * Creates a computed property for mobile logo.
 */
export function getMobileLogo(app: VcsUiApp): ComputedRef<string | undefined> {
  return computed(() => {
    const { config } = app.uiConfig;
    const isDark = app.vuetify.theme.current.value.dark;

    return isDark
      ? (config.mobileLogoDark ??
          config.logoDark ??
          config.mobileLogo ??
          config.logo)
      : (config.mobileLogo ?? config.logo);
  });
}
