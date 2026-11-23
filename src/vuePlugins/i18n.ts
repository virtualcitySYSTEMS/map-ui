import { customRef, type Ref } from 'vue';
import type { VcsApp } from '@vcmap/core';
import {
  createVcsI18n,
  type TranslateFunction,
  type VcsI18n,
} from '../i18n/vcsI18n.js';
import type VcsUiApp from '../vcsUiApp.js';

/**
 * Creates a ref providing the locale of the app. The ref reads app.locale, so it is never out of sync with the app,
 * also within localeChanged listeners. The localeChanged event only notifies the dependents of the ref.
 * The ref is read-only: writes are ignored, set the locale on the app instead.
 * Call destroy to remove the localeChanged listener.
 */
export function createAppLocale(
  app: Pick<VcsApp, 'locale' | 'localeChanged'>,
): { locale: Readonly<Ref<string>>; destroy: () => void } {
  let destroy = (): void => {};
  const locale = customRef<string>((track, trigger) => {
    destroy = app.localeChanged.addEventListener(() => {
      trigger();
    });
    return {
      get(): string {
        track();
        return app.locale;
      },
      set(): void {},
    };
  });
  return {
    locale,
    destroy: (): void => {
      destroy();
    },
  };
}

/**
 * Creates a new i18n instance, with english and german as fallback locales.
 * The locale defaults to english. Pass a ref to provide the locale: the instance follows the ref, which is changed by
 * its owner. The VcsUiApp passes a ref following app.locale. To translate with the locale of the app, use app.vcsI18n
 * instead of creating a new instance.
 */
export function createDefaultI18n(locale?: Readonly<Ref<string>>): VcsI18n {
  return createVcsI18n({
    locale: locale ?? 'en',
    fallbackLocale: ['en', 'de'],
    messages: {
      en: {},
    },
  });
}

declare module 'vue' {
  interface ComponentCustomProperties {
    /**
     * Translates the key, see VcsI18n.t. Handles keys which are not strings: null and undefined are rendered
     * as empty string, other keys (e.g. numbers) are rendered as string without being translated.
     */
    $t: TranslateFunction;
    /**
     * Safe translate, the same function as $t.
     */
    $st: TranslateFunction;
    /**
     * Read-only compatibility with vue-i18n, will be removed in next major release.
     * @deprecated use the locale of useVcsI18n()
     */
    $i18n: { readonly locale: string };
  }
}

/**
 * sets the messages to the app's I18n Instance;
 */
function setI18nMessages(app: VcsUiApp): void {
  app.vcsI18n.availableLocales.forEach((locale) => {
    app.vcsI18n.setLocaleMessage(locale, {});
  });
  Object.entries(app.i18n.getMergedMessages()).forEach(
    ([locale, localeMessages]) => {
      app.vcsI18n.setLocaleMessage(
        locale,
        localeMessages as Record<string, unknown>,
      );
    },
  );
}

/**
 * Synchronizes the messages of the app's i18n instance with the i18n collection of the app.
 * The locale of the app's i18n instance follows the locale of the app, it is not set up by this function.
 */
export function setupI18n(app: VcsUiApp): () => void {
  setI18nMessages(app);
  const destroyChanged = app.i18n.changed.addEventListener(() => {
    setI18nMessages(app);
  });
  return function tearDownI18nSetup() {
    destroyChanged();
  };
}
