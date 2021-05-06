import Vue from 'vue';
import VueI18n from 'vue-i18n';

import de from '@/lang/de';
import en from '@/lang/en';

Vue.use(VueI18n);

const i18n = new VueI18n({
  locale: 'de',
  messages: {
    en,
    de,
  },
});

Vue.filter('translate', (value, args) => i18n.t(value, args));

// eslint-disable-next-line import/prefer-default-export
export { i18n };
