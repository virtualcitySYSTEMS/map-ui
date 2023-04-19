import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import packageJSON from './package.json';
import ButtonsExample from './ButtonsExample.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function buttonsExample() {
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
    onVcsAppMounted(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Buttons Examples',
          title: 'Buttons Example Plugin',
          icon: '$vcsTouch',
        },
        {
          id: 'buttons-textfields-example',
          component: ButtonsExample,
          slot: WindowSlot.DETACHED,
          state: {
            headerTitle: 'Buttons Example',
            headerIcon: '$vcsTouch',
          },
          position: {
            width: 500,
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
