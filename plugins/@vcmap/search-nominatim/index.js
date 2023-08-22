import { version, name } from './package.json';
import Nominatim from './nominatim.js';
import SearchNominatimEditor from './SearchNominatimEditor.vue';

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
    /**
     * @returns {NominatimSearchOptions}
     */
    toJSON() {
      return this._instance.toJSON();
    },
    getDefaultOptions() {
      return Nominatim.getDefaultOptions();
    },
    getConfigEditors() {
      return [{ component: SearchNominatimEditor }];
    },
    i18n: {
      de: {
        searchNominatim: {
          name: 'Name',
          url: 'URL zu Nominatim',
          state: 'Bundesland',
          city: 'Stadt',
          countryCode: 'Ländercode',
          limit: 'Maximale Anzahl Resultate',
          bbox: 'Bounding Box',
        },
      },
      en: {
        searchNominatim: {
          name: 'Name',
          url: 'URL to Nominatim',
          state: 'State',
          city: 'City',
          countryCode: 'Country Code',
          limit: 'Maximum number of results',
          bbox: 'Bounding Box',
        },
      },
    },
  };
}
