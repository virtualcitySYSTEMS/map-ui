import Vue from 'vue';
import { check, checkMaybe } from '@vcsuite/check';
import { Context } from '@vcmap/core';
import VcsAppComponent from './application/VcsApp.vue';
import { vuetify } from './vuePlugins/vuetify.js';
import { i18n } from './vuePlugins/i18n.js';
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
  new Vue({
    vuetify,
    i18n,
    render: h => h(VcsAppComponent, {
      props: {
        appId: app.id,
      },
    }),
  }).$mount(mountTarget);

  if (configUrl) {
    const config = await fetch(configUrl)
      .then(response => response.json());
    const context = new Context(config);
    await app.addContext(context);
  }
  return app;
}
