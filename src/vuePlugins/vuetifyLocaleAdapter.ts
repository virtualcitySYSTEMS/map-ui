import { computed, shallowRef } from 'vue';
import type { LocaleInstance, LocaleMessages } from 'vuetify';
import { getLogger } from '@vcsuite/logger';
import type { VcsI18n } from '../i18n/vcsI18n.js';

/**
 * Creates a vuetify locale adapter, translating vuetify messages with the given i18n instance.
 * The current locale is the locale of the i18n instance. Scoped locales (VLocaleProvider) are not supported,
 * the same locale is provided to all components. The locale cannot be changed by vuetify, set it on the VcsUiApp instead.
 */
export function createVcsI18nVuetifyAdapter(i18n: VcsI18n): LocaleInstance {
  const fallback = i18n.fallbackLocale[0] ?? 'en';
  const locales = computed(() => [i18n.locale.value, fallback]);
  const numberFormat = computed(() => new Intl.NumberFormat(locales.value));

  const instance: LocaleInstance = {
    name: 'vcs-i18n',
    // vuetify expects a writable ref
    current: computed({
      get: () => i18n.locale.value,
      set: () => {
        getLogger('VcsI18n').warning('Set the locale on the VcsUiApp instead.');
      },
    }),
    fallback: shallowRef(fallback),
    messages: computed(() => i18n.messages.value as LocaleMessages),
    decimalSeparator: computed(() =>
      numberFormat.value.format(0.1).includes(',') ? ',' : '.',
    ),
    numericGroupSeparator: computed(
      () =>
        new Intl.NumberFormat(locales.value, { useGrouping: true })
          .formatToParts(10000)
          .find((p) => p.type === 'group')?.value ?? ' ',
    ),
    // all keys are passed to the i18n instance, so components can be given i18n keys (e.g. as no-data-text)
    t: (key: string, ...params: unknown[]): string => i18n.t(key, params),
    n: (value: number): string => numberFormat.value.format(value),
    provide: (): LocaleInstance => instance,
  };
  return instance;
}
