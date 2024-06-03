import { createApp } from 'vue';
import { check, checkMaybe, is } from '@vcsuite/check';
import { VcsModule } from '@vcmap/core';
import VcsAppComponentWrapper from './application/VcsAppWrapper.vue';
import VcsUiApp from './vcsUiApp.js';
import { createSafeI18n } from './vuePlugins/i18n.js';

/**
 * Base pattern to check VcsObjects
 */
const VcsObjectPattern = {
  type: String,
  name: String,
};

/**
 * Base pattern to check VcsUiAppConfig
 */
export const VcsUiAppConfigPattern = {
  id: [undefined, String],
  layers: [undefined, [VcsObjectPattern]],
  maps: [undefined, [VcsObjectPattern]],
  styles: [undefined, [VcsObjectPattern]],
  viewpoints: [undefined, [VcsObjectPattern]],
  startingViewpointName: [undefined, String],
  startingMapName: [undefined, String],
  projection: [undefined, Object],
  categories: [undefined, [{ name: String, items: [Object] }]],
  obliqueCollections: [undefined, [VcsObjectPattern]],
  plugins: [undefined, [Object]],
  contentTree: [undefined, [Object]],
  uiConfig: [undefined, [Object]],
  featureInfo: [undefined, [VcsObjectPattern]],
  i18n: [undefined, [Object]],
};

/**
 * creates and mounts a vcsApp
 * @param {string} mountTarget
 * @returns {Promise<import("@src/vcsUiApp.js").default>}
 */
export default async function initApp(mountTarget) {
  check(mountTarget, String);
  const app = new VcsUiApp();
  const vueApp = createApp(VcsAppComponentWrapper, {
    appId: app.id,
  });
  vueApp.use(app.vueI18nPlugin);
  const safeI18nPlugin = createSafeI18n();
  vueApp.use(safeI18nPlugin);
  vueApp.use(app.vuetify);
  vueApp.mount(mountTarget);

  return app;
}

/**
 * Initializes app with an optional single config
 * @param {string} mountTarget
 * @param {string=} configUrl optional config
 * @returns {Promise<import("@src/vcsUiApp.js").default>}
 */
export async function initAppFromModule(mountTarget, configUrl) {
  check(mountTarget, String);
  checkMaybe(configUrl, String);

  const app = await initApp(mountTarget);
  if (configUrl) {
    const config = await fetch(configUrl).then((response) => response.json());
    const module = new VcsModule(config);
    await app.addModule(module);
  }

  return app;
}

/**
 * Initializes app with a map config containing a set of config urls
 * @param {string} mountTarget
 * @param {string} appUrl app config containing further modules to be loaded
 * @returns {Promise<import("@src/vcsUiApp.js").default>}
 */
export async function initAppFromAppConfig(mountTarget, appUrl) {
  check(mountTarget, String);
  check(appUrl, String);

  const app = await initApp(mountTarget);
  /**
   * @type {{modules: Array<string|import("@vcmap/core").VcsModuleConfig>}}
   */
  const appConfig = await fetch(appUrl).then((response) => response.json());

  check(appConfig.modules, [String, Object]);

  const modules = await Promise.all(
    appConfig.modules.map(async (c) => {
      if (is(c, VcsUiAppConfigPattern)) {
        return new VcsModule(
          /** @type{import("@vcmap/core").VcsModuleConfig} */ c,
        );
      } else if (is(c, String)) {
        const response = await fetch(c);
        if (response.ok) {
          const config = await response.json();
          return new VcsModule(config);
        }
      }
      return null;
    }),
  );
  // eslint-disable-next-line no-restricted-syntax
  for await (const module of modules) {
    if (module) {
      await app.addModule(module);
    }
  }
}
