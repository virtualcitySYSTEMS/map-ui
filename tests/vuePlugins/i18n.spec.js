import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  beforeAll,
} from 'vitest';
import VcsUiApp from '../../src/vcsUiApp.js';
import { createVueI18n, setupI18n } from '../../src/vuePlugins/i18n.js';


describe('setupI18n', () => {
  let app;
  let destroyI18nSetup;
  let i18n;

  beforeAll(() => {
    i18n = createVueI18n();
  });

  beforeEach(() => {
    app = new VcsUiApp();
    destroyI18nSetup = setupI18n(app, i18n);
  });

  afterEach(() => {
    app.destroy();
    destroyI18nSetup();
  });

  it('should add the default messages to the i18n Collection', () => {
    expect(app.i18n.getMergedMessages()).to.have.keys(['de', 'en']);
  });

  it('should set the merged messages to the vue i18n Plugin', () => {
    expect(i18n.availableLocales).to.have.members(['de', 'en']);
  });

  it('should synchronize the application locale with the plugin locale', () => {
    expect(i18n.locale).to.be.equal(app.locale);
    app.locale = 'de';
    expect(i18n.locale).to.be.equal('de');
  });

  it('should add newly added i18n Keys to the vueI18n plugin', () => {
    app.i18n.add({ pl: 'test' });
    expect(i18n.availableLocales).to.have.members(['de', 'en', 'pl']);
  });

  it('should remove i18n Keys from the vueI18n plugin if they are removed from the app', () => {
    const item = { pl: 'test' };
    app.i18n.add(item);
    expect(i18n.availableLocales).to.have.members(['de', 'en', 'pl']);
    app.i18n.remove(item);
    expect(i18n.availableLocales).to.not.include.members(['pl']);
  });
});
