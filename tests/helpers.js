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

/**
 *
 * @param {{top: number, left: number, bottom: number, width: number, right: number, height: number}} targetRect
 * @returns {{target: HTMLDivElement, destroy: ()=>void}}
 */
export function setupMapTarget(targetRect = {}) {
  const vcsContainer = document.createElement('div');
  const panel = document.createElement('div');
  const vcsMainMap = document.createElement('div');
  const target = document.createElement('div');
  vcsMainMap.appendChild(target);
  panel.appendChild(vcsMainMap);
  vcsContainer.appendChild(panel);
  document.body.appendChild(vcsContainer);
  vcsContainer.getBoundingClientRect = () => targetRect;
  return {
    target,
    destroy: () => {
      document.body.removeChild(vcsContainer);
    },
  };
}
