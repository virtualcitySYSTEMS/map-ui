import { createI18n } from 'vue-i18n';
import { is } from '@vcsuite/check';
import { resolveValue } from '@intlify/core-base';

/**
 * creates a new VueI18n Instance.
 * @returns {import("vue-i18n").I18n}
 */
export function createVueI18n() {
  return createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'en',
    missingWarn: false,
    fallbackWarn: false,
    fallbackLocale: ['en', 'de'],
    messageResolver: (obj, path) => {
      const value = resolveValue(obj, path);
      return typeof value === 'string'
        ? value.replaceAll(/@/g, "{'@'}")
        : value;
    },
    messages: {
      en: {},
    },
    postTranslation: (val, key) => (typeof val === 'string' ? val : key),
  });
}

/**
 * creates a Vue Plugin with a new $st template helper which can handle undefined. Will just redirect to vueI18n,
 * if key is a string
 * @returns {import("vue").Plugin}
 */
export function createSafeI18n() {
  return {
    install: (vApp) => {
      vApp.config.globalProperties.$st = (key, ...args) => {
        if (!is(key, String)) {
          if (key !== null && key !== undefined) {
            return String(key);
          }
          return '';
        }
        return vApp.config.globalProperties.$t(key, ...args);
      };
    },
  };
}

/**
 * sets the messages to the app's I18n Instance;
 * @param {import("../vcsUiApp.js").default} app
 */
function setI18nMessages(app) {
  app.vueI18n.availableLocales.forEach((locale) => {
    app.vueI18n.setLocaleMessage(locale, {});
  });
  Object.entries(app.i18n.getMergedMessages()).forEach(
    ([locale, localeMessages]) => {
      app.vueI18n.setLocaleMessage(locale, localeMessages);
    },
  );
}

/**
 * @param {import("../vcsUiApp.js").default} app
 * @returns {function():void} returns a destroy function
 */
export function setupI18n(app) {
  setI18nMessages(app);
  app.vueI18n.locale.value = app.locale;
  const destroyFunctions = [
    app.i18n.changed.addEventListener(() => {
      setI18nMessages(app);
    }),
    app.localeChanged.addEventListener((locale) => {
      app.vueI18n.locale.value = locale;
    }),
  ];
  return function tearDownI18nSetup() {
    destroyFunctions.forEach((destroy) => {
      destroy();
    });
    app.vueI18nPlugin.dispose();
  };
}
