import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { i18nPluginSymbol } from '../i18n/i18nCollection.js';
import { vcsAppSymbol } from '../pluginHelper.js';
import de from '../i18n/de.js';
import en from '../i18n/en.js';

Vue.use(VueI18n);

/**
 * creates a new VueI18n Instance.
 * @returns {VueI18n}
 */
export function createVueI18n() {
  const i18n = new VueI18n({
    locale: 'en',
    silentFallbackWarn: true,
    silentTranslationWarn: true,
    fallbackLocale: ['en', 'de'],
    messages: {
      en: {},
    },
    postTranslation: (val, key) => (typeof val === 'string' ? val : key),
  });
  return i18n;
}

/**
 * sets the messages to the given I18n Instance;
 * @param {Object} messages
 * @param {VueI18n} i18n
 */
function setI18n(messages, i18n) {
  i18n.availableLocales.forEach((locale) => {
    i18n.setLocaleMessage(locale, undefined);
  });
  Object.entries(messages).forEach(([locale, localeMessages]) => {
    i18n.setLocaleMessage(locale, localeMessages);
  });
}

/**
 * @param {VcsUiApp} app
 * @param {VueI18n} i18n
 * @returns {function():void} returns a destroy function
 */
export function setupI18n(app, i18n) {
  const defaultMessages = { name: 'default', en, de };
  defaultMessages[i18nPluginSymbol] = vcsAppSymbol;
  app.i18n.add(defaultMessages);

  setI18n(app.i18n.getMergedMessages(), i18n);
  i18n.locale = app.locale;
  const destroyFunctions = [
    app.i18n.added.addEventListener(() => {
      setI18n(app.i18n.getMergedMessages(), i18n);
    }),
    app.i18n.removed.addEventListener(() => {
      setI18n(app.i18n.getMergedMessages(), i18n);
    }),
    app.localeChanged.addEventListener((locale) => {
      i18n.locale = locale;
    }),
  ];
  return function tearDownI18nSetup() {
    destroyFunctions.forEach((destroy) => {
      destroy();
    });
  };
}
