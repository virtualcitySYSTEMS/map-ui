import { WindowSlot } from '@vcmap/ui';
import { name, version, mapVersion } from '../package.json';
import getDefaultOptions from './defaultOptions.js';
import HelloWorld, { windowId } from './helloWorld.vue';

/**
 * @typedef {Object} PluginConfig
 * @property {boolean} [showLogHelloWorld]
 * @property {boolean} [showComponent=true] - Whether to show the HelloWorld Vue component or just log 'Hello World!' to console
 */

/**
 * @typedef {Object} PluginState
 * @property {import("@vcmap/ui").WindowPositionOptions} [windowPosition]
 * @property {boolean} active
 */

/**
 * A function returning 'Hello World!'.
 * @returns {string}
 */
export function helloWorld() {
  return 'Hello World!';
}

/**
 * @param {PluginConfig} config - the configuration of this plugin instance, passed in from the app.
 * @param {string} baseUrl - the absolute URL from which the plugin was loaded (without filename, ending on /)
 * @returns {import("@vcmap/ui/src/vcsUiApp").VcsPlugin<PluginConfig, PluginState>}
 */
export default function helloWorldPlugin(config, baseUrl) {
  console.log(config, baseUrl);
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
    get config() {
      return { ...getDefaultOptions(), ...config };
    },
    helloWorld,
    /**
     * @param {import("@vcmap/ui").VcsUiApp} vcsUiApp
     * @param {PluginState=} state
     */
    initialize(vcsUiApp, state) {
      console.log(
        'Called before loading the rest of the current context. Passed in the containing Vcs UI App ',
        vcsUiApp,
        state,
      );
      this._app = vcsUiApp;
    },
    /**
     * @param {import("@vcmap/ui").VcsUiApp} vcsUiApp
     * @returns {Promise<void>}
     */
    async onVcsAppMounted(vcsUiApp) {
      if (this.config.showComponent) {
        vcsUiApp.windowManager.add(
          {
            id: windowId,
            component: HelloWorld,
            WindowSlot: WindowSlot.DETACHED,
            position: {
              left: '40%',
              right: '40%',
            },
            state: {
              headerTitle: name,
            },
          },
          name,
        );
      } else {
        console.log(name, helloWorld());
      }
    },
    /**
     * @param {boolean} forUrl
     * @returns {PluginState}
     */
    getState(forUrl) {
      console.log('Called when collecting state, e.g. for create link', forUrl);
      const state = {
        active: this._app.windowManager.has(windowId),
      };
      if (!forUrl) {
        state.position = this._app.windowManager.get(windowId).position;
      }
      return state;
    },
    getDefaultOptions,
    /**
     * @returns {PluginConfig}
     */
    toJSON() {
      console.log('Called when serializing this plugin instance');
      const defaultOptions = getDefaultOptions();
      const options = {};
      if (this.config.showLogHelloWorld !== defaultOptions.showLogHelloWorld) {
        options.showLogHelloWorld = this.config.showLogHelloWorld;
      }
      if (this.config.showComponent !== defaultOptions.showComponent) {
        options.showComponent = this.config.showComponent;
      }
      return options;
    },
    i18n: {
      en: {
        helloWorld: {
          helloWorld: 'Hello World',
          close: 'Close',
          log: 'Log',
          logTooltip: 'Log Hello World to console',
        },
      },
      de: {
        helloWorld: {
          helloWorld: 'Hallo Welt',
          close: 'Schließen',
          log: 'Loggen',
          logTooltip: 'Logge Hello World in Console',
        },
      },
    },
    destroy() {
      console.log('hook to cleanup');
    },
  };
}
