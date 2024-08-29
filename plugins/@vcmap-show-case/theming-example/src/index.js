import { createToggleAction, ButtonLocation, WindowSlot } from '@vcmap/ui';
import packageJSON from '../package.json';
import ThemingExample from './ThemingExample.vue';

/**
 * @returns {VcsPlugin}
 */
export default async () => {
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
          name: 'Theming Example',
          icon: '$vcsWand',
          title: 'Theming Example Plugin',
        },
        {
          id: 'theming-example',
          component: ThemingExample,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'Theming Example',
            headerIcon: '$vcsWand',
            styles: { width: '350px', height: 'auto' },
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: 'theming-example', action },
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
};
