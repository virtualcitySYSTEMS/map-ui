/* eslint-disable @typescript-eslint/unified-signatures */
import {
  createI18n,
  type I18n,
  type TranslateOptions,
  type NamedValue,
} from 'vue-i18n';
import { is } from '@vcsuite/check';
import { resolveValue } from '@intlify/core-base';
import type { Plugin } from 'vue';
import type VcsUiApp from '../vcsUiApp.js';

/**
 * creates a new VueI18n Instance.
 */
export function createVueI18n(): I18n {
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

declare module 'vue' {
  interface ComponentCustomProperties {
    $st(key: string | number | undefined | null): string;
    $st(
      key: string | number | undefined | null,
      plural: number,
      options?: TranslateOptions,
    ): string;
    $st(
      key: string | number | undefined | null,
      defaultMsg: string,
      options?: TranslateOptions,
    ): string;
    $st(
      key: string | number | undefined | null,
      list: unknown[],
      options?: TranslateOptions,
    ): string;
    $st(
      key: string | number | undefined | null,
      list: unknown[],
      plural: number,
    ): string;
    $st(
      key: string | number | undefined | null,
      list: unknown[],
      defaultMsg: string,
    ): string;
    $st(
      key: string | number | undefined | null,
      named: NamedValue,
      options?: TranslateOptions,
    ): string;
    $st(
      key: string | number | undefined | null,
      named: NamedValue,
      plural: number,
    ): string;
    $st(
      key: string | number | undefined | null,
      named: NamedValue,
      defaultMsg: string,
    ): string;
  }
}

/**
 * creates a Vue Plugin with a new $st template helper which can handle undefined. Will just redirect to vueI18n,
 * if key is a string
 */
export function createSafeI18n(): Plugin {
  return {
    install: (vApp): void => {
      vApp.config.globalProperties.$st = (
        key: string | number | undefined | null,
        ...args: unknown[]
      ): string => {
        if (!is(key, String)) {
          if (key !== null && key !== undefined) {
            return String(key);
          }
          return '';
        }
        return vApp.config.globalProperties.$t(key, ...args);
      };
    },
  } satisfies Plugin;
}

/**
 * sets the messages to the app's I18n Instance;
 * @param {import("../vcsUiApp.js").default} app
 */
function setI18nMessages(app: VcsUiApp): void {
  app.vueI18n.availableLocales.forEach((locale) => {
    app.vueI18n.setLocaleMessage(locale, {});
  });
  Object.entries(app.i18n.getMergedMessages()).forEach(
    ([locale, localeMessages]) => {
      app.vueI18n.setLocaleMessage(locale, localeMessages);
    },
  );
}

export function setupI18n(app: VcsUiApp): () => void {
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
