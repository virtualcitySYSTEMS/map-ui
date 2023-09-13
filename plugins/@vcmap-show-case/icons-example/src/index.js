import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import packageJSON from '../package.json';
import AllIconsComponent from './AllIconsComponent.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function iconsExample() {
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
          name: 'Icons Examples',
          title: 'Icons Example Plugin',
        },
        {
          id: 'icons-example',
          component: AllIconsComponent,
          slot: WindowSlot.DETACHED,
          state: {
            headerTitle: 'Icons Example',
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
