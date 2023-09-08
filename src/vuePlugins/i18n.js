import Vue from 'vue';
import VueI18n from 'vue-i18n';

Vue.use(VueI18n);

/**
 * creates a new VueI18n Instance.
 * @returns {import("vue-i18n").VueI18n}
 */
export function createVueI18n() {
  return new VueI18n({
    locale: 'en',
    silentFallbackWarn: true,
    silentTranslationWarn: true,
    fallbackLocale: ['en', 'de'],
    messages: {
      en: {},
    },
    postTranslation: (val, key) => (typeof val === 'string' ? val : key),
  });
}

/**
 * sets the messages to the app's I18n Instance;
 * @param {VcsUiApp} app
 */
function setI18nMessages(app) {
  app.vueI18n.availableLocales.forEach((locale) => {
    app.vueI18n.setLocaleMessage(locale, undefined);
  });
  Object.entries(app.i18n.getMergedMessages()).forEach(
    ([locale, localeMessages]) => {
      app.vueI18n.setLocaleMessage(locale, localeMessages);
    },
  );
}

/**
 * @param {VcsUiApp} app
 * @returns {function():void} returns a destroy function
 */
export function setupI18n(app) {
  setI18nMessages(app);
  app.vueI18n.locale = app.locale;
  const destroyFunctions = [
    app.i18n.added.addEventListener(() => {
      setI18nMessages(app);
    }),
    app.i18n.removed.addEventListener(() => {
      setI18nMessages(app);
    }),
    app.localeChanged.addEventListener((locale) => {
      app.vueI18n.locale = locale;
    }),
  ];
  return function tearDownI18nSetup() {
    destroyFunctions.forEach((destroy) => {
      destroy();
    });
  };
}
