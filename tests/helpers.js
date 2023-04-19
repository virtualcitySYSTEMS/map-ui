import { createLocalVue } from '@vue/test-utils';
import Vuetify from 'vuetify';
import VueI18n from 'vue-i18n';
import { createVueI18n } from '../src/vuePlugins/i18n.js';
import { createVuetify } from '../src/vuePlugins/vuetify.js';

/**
 * @param {number} [ms=0]
 * @returns {Promise<unknown>}
 */
export async function sleep(ms = 0) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @returns {{ localVue: VueConstructor<Vue>, i18n: VueI18n }}
 */
export function getMountOptionsWithI18n() {
  const localVue = createLocalVue();
  localVue.use(VueI18n);
  localVue.use(Vuetify);

  const i18n = createVueI18n();

  return {
    vuetify: createVuetify(),
    localVue,
    i18n,
  };
}
