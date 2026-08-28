import { createApp } from 'vue';
import { check, is, maybe, oneOf, optional } from '@vcsuite/check';
import type { Pattern } from '@vcsuite/check';
import type { VcsModuleConfig } from '@vcmap/core';
import { VcsModule } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';
import VcsAppComponentWrapper from './application/VcsAppWrapper.ts.vue';
import VcsUiApp from './vcsUiApp.js';
import { createSafeI18n } from './vuePlugins/i18n.js';

/**
 * Base pattern to check VcsObjects
 */
const vcsObjectPattern = {
  type: String,
  name: String,
};

/**
 * Base pattern to check VcsUiAppConfig
 */
export const vcsUiAppConfigPattern: Record<string, Pattern> = {
  id: optional(String),
  layers: optional([vcsObjectPattern]),
  maps: optional([vcsObjectPattern]),
  styles: optional([vcsObjectPattern]),
  viewpoints: optional([vcsObjectPattern]),
  startingObliqueCollectionName: maybe(String),
  startingViewpointName: maybe(String),
  startingMapName: maybe(String),
  projection: maybe(Object),
  categories: optional([{ name: String, items: [Object] }]),
  obliqueCollections: optional([vcsObjectPattern]),
  plugins: optional([Object]),
  contentTree: optional([Object]),
  uiConfig: optional([Object]),
  featureInfo: optional([vcsObjectPattern]),
  i18n: optional([Object]),
};

/**
 * creates and mounts a vcsApp
 */
export default function initApp(mountTarget: string): VcsUiApp {
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
 */
export async function initAppFromModule(
  mountTarget: string,
  configUrl?: string,
): Promise<VcsUiApp> {
  check(mountTarget, String);
  check(configUrl, maybe(String));

  const app = initApp(mountTarget);
  if (configUrl) {
    const config = await fetch(configUrl).then((response) => response.json());
    const module = new VcsModule(config);
    await app.addModule(module);
  }

  return app;
}

/**
 * Creates a module from a config object or a url
 */
export async function createModuleFromObjectOrUrl(
  c: VcsModuleConfig | string,
): Promise<VcsModule | null> {
  if (is(c, Object)) {
    if (!is(c, vcsUiAppConfigPattern)) {
      getLogger('init').warning(
        'Provided object is no valid VcsUiAppConfig',
        c,
      );
    }
    return new VcsModule(c);
  } else if (is(c, String)) {
    const response = await fetch(c);
    if (response.ok) {
      const config = await response.json();
      return new VcsModule(config);
    }
  }
  return null;
}

/**
 * Initializes app with a map config containing a set of config urls
 * @param appUrl app config containing further modules to be loaded
 */
export async function initAppFromAppConfig(
  mountTarget: string,
  appUrl: string,
): Promise<void> {
  check(mountTarget, String);
  check(appUrl, String);

  const app = initApp(mountTarget);
  const appConfig = (await fetch(appUrl).then((response) =>
    response.json(),
  )) as { modules: Array<string | VcsModuleConfig> };

  check(appConfig.modules, [oneOf(String, Object)]);

  const modules = await Promise.all(
    appConfig.modules.map(createModuleFromObjectOrUrl),
  );

  // eslint-disable-next-line @typescript-eslint/await-thenable
  for await (const module of modules) {
    if (module) {
      await app.addModule(module);
    }
  }
}
