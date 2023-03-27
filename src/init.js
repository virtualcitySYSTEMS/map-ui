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
 * @returns {Promise<VcsUiApp>}
 */
export default async function initApp(mountTarget) {
  check(mountTarget, String);
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
  return app;
}

/**
 * Initializes app with an optional single config
 * @param {string} mountTarget
 * @param {string=} configUrl optional config
 * @returns {Promise<VcsUiApp>}
 */
export async function initAppFromContext(mountTarget, configUrl) {
  check(mountTarget, String);
  checkMaybe(configUrl, String);

  const app = await initApp(mountTarget);
  if (configUrl) {
    const config = await fetch(configUrl)
      .then(response => response.json());
    const context = new Context(config);
    await app.addContext(context);
  }

  return app;
}

/**
 * Initializes app with a map config containing a set of config urls
 * @param {string} mountTarget
 * @param {string} mapUrl map config containing further contexts to be loaded
 * @returns {Promise<VcsUiApp>}
 */
export async function initAppFromMapConfig(mountTarget, mapUrl) {
  check(mountTarget, String);
  check(mapUrl, String);

  const app = await initApp(mountTarget);
  /**
   * @type {{configs: string[]}}
   */
  const mapConfig = await fetch(mapUrl)
    .then(response => response.json());

  check(mapConfig.configs, [String]);

  const contexts = await Promise.all(mapConfig.configs.map(async (configUrl) => {
    const config = await fetch(configUrl)
      .then(response => response.json());
    return new Context(config);
  }));
  // eslint-disable-next-line no-restricted-syntax
  for await (const context of contexts) {
    await app.addContext(context);
  }
}
