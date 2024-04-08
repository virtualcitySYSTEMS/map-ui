import { ButtonLocation, createToggleAction } from '@vcmap/ui';
import packageJSON from '../package.json';
import panelExample from './PanelExample.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function panelTester() {
  return {
    get name() {
      return packageJSON.name;
    },
    get version() {
      return packageJSON.version;
    },
    get mapVersion() {
      return packageJSON.mapVersion;
    },
    onVcsAppMounted(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Panel Tester',
        },
        {
          id: 'panel-tester',
          state: {
            headerTitle: 'panelTester.title',
          },
          component: panelExample,
          position: {
            height: 200,
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: 'panel-tester', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this._destroyAction = [destroy];
    },
    i18n: {
      de: {
        panelTester: {
          title: 'Panel Tester',
        },
      },
      en: {
        panelTester: {
          title: 'Panel Tester',
        },
      },
    },
    destroy() {
      if (this._destroyActions) {
        this._destroyActions.forEach((cb) => cb());
        this._destroyActions = null;
      }
    },
  };
}
