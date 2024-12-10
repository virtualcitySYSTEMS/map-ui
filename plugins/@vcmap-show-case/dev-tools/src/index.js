import { CesiumMap, ObliqueMap, OpenlayersMap } from '@vcmap/core';
import { name, version, mapVersion } from '../package.json';
import EventLogger from './eventLogger.js';

/**
 * @typedef {Object} DevTools
 * @property {() => import("@vcmap/core").VcsApp} getApp
 * @property {() => import("@vcmap/core").CesiumMap | undefined} getCesiumMap
 * @property {() => import("@vcmap/core").OpenlayersMap | undefined} getOpenlayersMap
 * @property {() => import("@vcmap/core").ObliqueMap | undefined} getObliqueMap
 * @property {EventLogger} eventLogger
 */

/**
 * @param {DevTools} plugin
 * @param {VcsUiApp} app
 */
function setup(plugin, app) {
  plugin.getApp = () => {
    return app;
  };

  plugin.getCesiumMap = () => {
    return app.maps.getByType(CesiumMap.className)[0];
  };

  plugin.getOpenlayersMap = () => {
    return app.maps.getByType(OpenlayersMap.className)[0];
  };

  plugin.getObliqueMap = () => {
    return app.maps.getByType(ObliqueMap.className)[0];
  };

  plugin.eventLogger = new EventLogger();
  app.maps.eventHandler.addPersistentInteraction(plugin.eventLogger);
}

export default function devTools() {
  return {
    name,
    version,
    mapVersion,
    initialize(app) {
      if (window.vcs.devTools) {
        console.error(
          'dev tool already loaded! something must have gone wrong somewhere',
        );
      }
      window.vcs.devTools = this;
      setup(this, app);
    },
    destroy() {
      if (window.vcs.devTools === this) {
        window.vcs.devTools = undefined;
      }
    },
  };
}
