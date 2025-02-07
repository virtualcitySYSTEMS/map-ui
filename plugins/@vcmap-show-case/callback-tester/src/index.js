import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import CallbackTester from './CallbackTester.vue';
import packageJSON from '../package.json';

/**
 * @returns {VcsPlugin}
 */
export default function callbackTester() {
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
          name: 'Callback Tester',
          title: 'Callback Tester Plugin',
          icon: 'mdi-phone-return-outline',
        },
        {
          id: 'callback-tester',
          component: CallbackTester,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'Callback Tester',
            headerIcon: 'mdi-phone-return-outline',
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add({ action }, packageJSON.name, ButtonLocation.TOOL);
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
