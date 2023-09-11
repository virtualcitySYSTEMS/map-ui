import { ref } from 'vue';
import { check } from '@vcsuite/check';
import { ButtonLocation, createToggleAction, vuetify } from '@vcmap/ui';
import ThemeChangerComponent from './ThemeChangerComponent.vue';
import packageJSON from './package.json';
import defaultConfig from './config.json';

/**
 * @typedef {Object} VuetifyTheme
 * @property {string} primary
 * @property {string} secondary
 * @property {string} accent
 * @property {string} error
 * @property {string} info
 * @property {string} success
 * @property {string} warning
 */

/**
 * @typedef {Object} VcMapTheme
 * @property {string} name
 * @property {VuetifyTheme} light
 * @property {VuetifyTheme} dark
 */

/**
 * @param {Object} config
 * @returns {VcsPlugin}
 */
export default async function themeChanger(config) {
  /** @type {VcMapTheme} */
  const vcsTheme = {
    name: 'VCS Theme',
    ...vuetify.userPreset.theme.themes,
  };
  const customThemes = config.themes || defaultConfig.themes;
  const availableThemes = [vcsTheme, ...customThemes];

  const pluginConfig = {
    themes: ref(/** @type {Array<VcMapTheme>} */ []),
  };

  const pluginState = {
    selected: ref(vcsTheme.name),
  };

  /**
   * @param {VcMapTheme} theme
   */
  function addTheme(theme) {
    check(theme.name, String);
    check(theme.light, Object);
    check(theme.dark, Object);
    pluginConfig.themes.value.push(theme);
  }
  availableThemes.forEach((t) => addTheme(t));

  return {
    get name() {
      return packageJSON.name;
    },
    get version() {
      return packageJSON.version;
    },
    get vcMapVersion() {
      return packageJSON.vcMapVersion;
    },
    config: pluginConfig,
    state: pluginState,
    addTheme,
    onVcsAppMounted(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Theme Changer',
          icon: 'mdi-palette',
        },
        {
          id: 'theme-changer',
          component: ThemeChangerComponent,
          position: {
            left: '60%',
            right: '0%',
            top: '5%',
            bottom: '50%',
          },
          state: {
            headerTitle: 'Theme Changer',
            headerIcon: 'mdi-palette',
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: 'theme-changer', action },
        packageJSON.name,
        ButtonLocation.MENU,
      );
      this._destroyAction = destroy;
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
