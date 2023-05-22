import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import VcsUiApp from '../../src/vcsUiApp.js';

describe('setupI18n', () => {
  let app;

  beforeEach(() => {
    app = new VcsUiApp();
  });

  afterEach(() => {
    app.destroy();
  });

  it('should add the default messages to the i18n Collection', () => {
    expect(app.i18n.getMergedMessages()).to.have.keys(['de', 'en']);
  });

  it('should set the merged messages to the vue i18n Plugin', () => {
    expect(app.vueI18n.availableLocales).to.have.members(['de', 'en']);
  });

  it('should synchronize the application locale with the plugin locale', () => {
    expect(app.vueI18n.locale).to.be.equal(app.locale);
    app.locale = 'de';
    expect(app.vueI18n.locale).to.be.equal('de');
  });

  it('should add newly added i18n Keys to the vueI18n plugin', () => {
    app.i18n.add({ pl: 'test' });
    expect(app.vueI18n.availableLocales).to.have.members(['de', 'en', 'pl']);
  });

  it('should remove i18n Keys from the vueI18n plugin if they are removed from the app', () => {
    const item = { pl: 'test' };
    app.i18n.add(item);
    expect(app.vueI18n.availableLocales).to.have.members(['de', 'en', 'pl']);
    app.i18n.remove(item);
    expect(app.vueI18n.availableLocales).to.not.include.members(['pl']);
  });

  describe('translating', () => {
    it('should translate i18n keys to the current language', () => {
      app.i18n.add({ name: 'test', de: { app: 'Anwendung' } });
      const translated = app.vueI18n.t('app');
      expect(translated).to.be.equal('Anwendung');
    });
  });
});
