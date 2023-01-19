import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import packageJSON from './package.json';
import ListExample from './ListExample.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function iconsExample() {
  return {
    get name() { return packageJSON.name; },
    get version() { return packageJSON.version; },
    get vcMapVersion() { return packageJSON.vcMapVersion; },
    onVcsAppMounted(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'List Examples',
          title: 'List Example Plugin',
        },
        {
          id: 'list-example',
          component: ListExample,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'List Example',
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { action },
        packageJSON.name,
        ButtonLocation.TOOL,
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
