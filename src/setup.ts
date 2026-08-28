import '@vcmap/core';
import type { VcsPlugin, PluginConfig } from './vcsUiApp.js';

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    VcsPluginLoaderFunction?: (
      name: string,
      module: string,
    ) => Promise<{
      default: (
        config: PluginConfig,
        baseUrl: string,
      ) => Promise<VcsPlugin<PluginConfig>>;
    }>;
  }
}

window.CESIUM_BASE_URL = '/node_modules/@vcmap-cesium/engine/Build/';
