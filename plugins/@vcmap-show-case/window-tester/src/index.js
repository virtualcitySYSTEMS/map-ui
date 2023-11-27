import { ButtonLocation, createToggleAction } from '@vcmap/ui';
import packageJSON from '../package.json';
import windowExample from './WindowExample.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function windowTester() {
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
          name: 'Window Tester',
        },
        {
          id: 'window-tester',
          state: {
            headerTitle: 'windowTester.title',
          },
          component: windowExample,
          position: {
            left: '55%',
            right: '10%',
            top: '10%',
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: 'window-tester', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this._destroyAction = destroy;
    },
    i18n: {
      de: {
        windowTester: {
          title: 'Fenster Tester',
        },
      },
      en: {
        windowTester: {
          title: 'Window Tester',
        },
      },
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
