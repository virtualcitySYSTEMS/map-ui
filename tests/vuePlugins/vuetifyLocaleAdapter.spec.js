import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { getLogger } from '@vcsuite/logger';
import { ref } from 'vue';
import { createVcsI18n } from '../../src/i18n/vcsI18n.ts';
import { createVcsI18nVuetifyAdapter } from '../../src/vuePlugins/vuetifyLocaleAdapter.ts';

describe('vuetifyLocaleAdapter', () => {
  let composer;
  let locale;
  let adapter;

  beforeEach(() => {
    locale = ref('en');
    composer = createVcsI18n({
      locale,
      fallbackLocale: ['en', 'de'],
      messages: {
        en: {
          $vuetify: { pageText: '{0}-{1} of {2}', close: 'Close' },
          components: { noData: 'No data' },
        },
        de: {
          $vuetify: { pageText: '{0}-{1} von {2}' },
        },
      },
    });
    adapter = createVcsI18nVuetifyAdapter(composer);
  });

  it('should translate vuetify messages with list parameters', () => {
    expect(adapter.t('$vuetify.pageText', 1, 10, 100)).to.equal('1-10 of 100');
  });

  it('should translate any i18n key, not only vuetify keys', () => {
    expect(adapter.t('components.noData')).to.equal('No data');
    expect(adapter.t('not translated')).to.equal('not translated');
  });

  it('should follow the composer locale', () => {
    locale.value = 'de';
    expect(adapter.current.value).to.equal('de');
    expect(adapter.t('$vuetify.pageText', 1, 10, 100)).to.equal('1-10 von 100');
    expect(adapter.t('$vuetify.close')).to.equal('Close');
  });

  describe('setting the current locale', () => {
    let warning;

    beforeEach(() => {
      warning = vi.spyOn(getLogger('VcsI18n'), 'warning');
    });

    afterEach(() => {
      warning.mockRestore();
    });

    it('should not set the locale, but warn', () => {
      adapter.current.value = 'de';
      expect(adapter.current.value).to.equal('en');
      expect(composer.locale.value).to.equal('en');
      expect(warning).toHaveBeenCalledWith(
        'Set the locale on the VcsUiApp instead.',
      );
    });
  });

  it('should expose the first fallback locale', () => {
    expect(adapter.fallback.value).to.equal('en');
  });

  it('should format numbers and infer separators for the current locale', () => {
    expect(adapter.n(1000.5)).to.equal('1,000.5');
    expect(adapter.decimalSeparator.value).to.equal('.');
    expect(adapter.numericGroupSeparator.value).to.equal(',');
    locale.value = 'de';
    expect(adapter.n(1000.5)).to.equal('1.000,5');
    expect(adapter.decimalSeparator.value).to.equal(',');
    expect(adapter.numericGroupSeparator.value).to.equal('.');
  });

  it('should provide the same locale to all components', () => {
    expect(adapter.provide({ locale: 'de' })).to.equal(adapter);
  });
});
