import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { computed } from 'vue';
import { VcsEvent } from '@vcmap/core';
import VcsUiApp from '../../src/vcsUiApp.ts';
import { createAppLocale } from '../../src/vuePlugins/i18n.ts';
import { createVcsI18n } from '../../src/i18n/vcsI18n.ts';

describe('i18n vue plugin', () => {
  describe('createAppLocale', () => {
    let app;
    let appLocale;

    /**
     * Sets the locale like the VcsApp: the locale is set before localeChanged is raised
     */
    function setLocale(locale) {
      app.locale = locale;
      app.localeChanged.raiseEvent(locale);
    }

    beforeEach(() => {
      app = { locale: 'en', localeChanged: new VcsEvent() };
      appLocale = createAppLocale(app);
    });

    afterEach(() => {
      appLocale.destroy();
      app.localeChanged.destroy();
    });

    it('should provide the locale of the app', () => {
      expect(appLocale.locale.value).to.equal('en');
      setLocale('de');
      expect(appLocale.locale.value).to.equal('de');
    });

    it('should notify dependents on localeChanged', () => {
      const upper = computed(() => appLocale.locale.value.toUpperCase());
      expect(upper.value).to.equal('EN');
      setLocale('de');
      expect(upper.value).to.equal('DE');
    });

    it('should be read-only', () => {
      appLocale.locale.value = 'de';
      expect(appLocale.locale.value).to.equal('en');
      expect(app.locale).to.equal('en');
    });

    it('should provide the new locale to listeners added before it', () => {
      const otherApp = { locale: 'en', localeChanged: new VcsEvent() };
      let localeInListener;
      otherApp.localeChanged.addEventListener(() => {
        // eslint-disable-next-line no-use-before-define
        localeInListener = i18n.locale.value;
      });
      const otherLocale = createAppLocale(otherApp);
      const i18n = createVcsI18n({ locale: otherLocale.locale });
      // read before the change, so a cached locale would be stale within the listener
      expect(i18n.locale.value).to.equal('en');
      otherApp.locale = 'de';
      otherApp.localeChanged.raiseEvent('de');
      expect(localeInListener).to.equal('de');
      otherLocale.destroy();
    });

    it('should remove the localeChanged listener on destroy', () => {
      expect(app.localeChanged.numberOfListeners).to.equal(1);
      appLocale.destroy();
      expect(app.localeChanged.numberOfListeners).to.equal(0);
    });
  });

  describe('setupI18n', () => {
    let app;

    beforeEach(() => {
      app = new VcsUiApp();
    });

    afterEach(() => {
      app.destroy();
    });

    it('should set the merged messages to the vcsI18n plugin', () => {
      expect(app.vcsI18n.availableLocales).to.have.members(['de', 'en']);
    });

    it('should provide the vcsI18n plugin with the deprecated vueI18n and vueI18nPlugin', () => {
      expect(app.vueI18n).to.equal(app.vcsI18n);
      expect(app.vueI18nPlugin).to.equal(app.vcsI18n);
    });

    it('should synchronize the application locale with the plugin locale', () => {
      expect(app.vcsI18n.locale.value).to.be.equal(app.locale);
      app.locale = 'de';
      expect(app.vcsI18n.locale.value).to.be.equal('de');
    });

    it('should not set the application locale with the read-only plugin locale', () => {
      app.locale = 'en';
      app.vcsI18n.locale.value = 'de';
      expect(app.locale).to.equal('en');
      expect(app.vcsI18n.locale.value).to.equal('en');
    });

    it('should provide the new locale within localeChanged listeners', () => {
      app.locale = 'en';
      app.i18n.add({
        name: 'test',
        en: { app: 'App' },
        de: { app: 'Anwendung' },
      });
      let translated;
      const remove = app.localeChanged.addEventListener(() => {
        translated = app.vcsI18n.t('app');
      });
      app.locale = 'de';
      remove();
      expect(translated).to.equal('Anwendung');
    });

    it('should destroy the app locale on destroy', () => {
      // the VcsApp destroys the localeChanged event as well, so the listener count does not show the app locale's teardown
      const otherApp = new VcsUiApp();
      const destroy = vi.spyOn(otherApp._appLocale, 'destroy');
      otherApp.destroy();
      expect(destroy).toHaveBeenCalledOnce();
    });

    it('should add newly added i18n Keys to the vcsI18n plugin', () => {
      app.i18n.add({ name: 'plTest', pl: 'test' });
      expect(app.vcsI18n.availableLocales).to.have.members(['de', 'en', 'pl']);
    });

    it('should remove i18n Keys from the vcsI18n plugin if they are removed from the app', () => {
      const item = { name: 'plTest', pl: { test: 'test' } };
      app.i18n.add(item);
      expect(app.vcsI18n.availableLocales).to.have.members(['de', 'en', 'pl']);
      app.i18n.remove(item);
      expect(app.vcsI18n.getLocaleMessage('pl')).to.be.empty;
    });

    describe('translating', () => {
      it('should translate i18n keys to the current language', () => {
        app.i18n.add({ name: 'test', de: { app: 'Anwendung' } });
        const translated = app.vcsI18n.t('app');
        expect(translated).to.be.equal('Anwendung');
      });
    });
  });
});
