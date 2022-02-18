import Vue from 'vue';
import { check, checkMaybe } from '@vcsuite/check';
import VcsAppComponent from './components/VcsApp.vue';
import { vuetify } from './plugins/index.js';
import { i18n } from './plugins/i18n.js';
import Context from './context.js';
import VcsApp from './vcsApp.js';

/**
 * creates and mounts a vcsApp
 * @param {string} mountTarget
 * @param {string=} configUrl optional config
 * @returns {Promise<VcsApp>}
 */
export default async function initApp(mountTarget, configUrl) {
  check(mountTarget, String);
  checkMaybe(configUrl, String);
  const app = new VcsApp();
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
