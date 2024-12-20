import { version, mapVersion, name } from '../package.json';
import SwitchMapCallback from './switchMapCallback.js';

/**
 * @returns {import("@vcmap/ui/src/vcsUiApp").VcsPlugin<T>}
 * @template {Object} T
 */
export default function switchMapCallbackExample() {
  return {
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    get mapVersion() {
      return mapVersion;
    },
    /**
     * @param {import("@vcmap/ui").VcsUiApp} vcsUiApp
     */
    initialize(vcsUiApp) {
      this._app = vcsUiApp;
      this._app.callbackClassRegistry.registerClass(
        this._app.dynamicModuleId,
        SwitchMapCallback.className,
        SwitchMapCallback,
      );
    },
    destroy() {
      this._app.callbackClassRegistry.unregisterClass(
        this._app.dynamicModuleId,
        SwitchMapCallback.className,
      );
    },
  };
}
