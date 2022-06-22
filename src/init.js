import Vue from 'vue';
import { check, checkMaybe } from '@vcsuite/check';
import { Context } from '@vcmap/core';
import VcsAppComponentWrapper from './application/vcsAppWrapper.vue';
import { vuetify } from './vuePlugins/vuetify.js';
import { createVueI18n, setupI18n } from './vuePlugins/i18n.js';
import VcsUiApp from './vcsUiApp.js';

/**
 * creates and mounts a vcsApp
 * @param {string} mountTarget
 * @param {string=} configUrl optional config
 * @returns {Promise<VcsUiApp>}
 */
export default async function initApp(mountTarget, configUrl) {
  check(mountTarget, String);
  checkMaybe(configUrl, String);
  const app = new VcsUiApp();
  const i18n = createVueI18n();
  new Vue({
    vuetify,
    i18n,
    render: h => h(VcsAppComponentWrapper, {
      props: {
        appId: app.id,
      },
    }),
  }).$mount(mountTarget);

  setupI18n(app, i18n);
  if (configUrl) {
    const config = await fetch(configUrl)
      .then(response => response.json());
    const context = new Context(config);
    await app.addContext(context);
  }
  return app;
}
