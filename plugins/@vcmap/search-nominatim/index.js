import { version, name } from './package.json';
import Nominatim from './nominatim.js';

/**
 * @param {NominatimSearchOptions} config - the configuration of this plugin instance, passed in from the app.
 * @returns {import("@vcmap/ui/src/vcsUiApp").VcsPlugin<T>}
 * @template {Object} T
 * @template {Object} S
 */
export default function searchNominatim(config) {
  return {
    _instance: null,
    _app: null,
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    /**
     * @param {import("@vcmap/ui").VcsUiApp} vcsUiApp
     */
    initialize(vcsUiApp) {
      this._instance = new Nominatim(config);
      this._app = vcsUiApp;
      vcsUiApp.search.add(this._instance, name);
    },
  };
}
