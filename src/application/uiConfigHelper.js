import { computed } from 'vue';

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
