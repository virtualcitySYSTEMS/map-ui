import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import packageJSON from './package.json';
import DataTableExample from './DataTableExample.vue';

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
    get vcMapVersion() {
      return packageJSON.vcMapVersion;
    },
    onVcsAppMounted(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Table Example',
          title: 'Table Example Plugin',
        },
        {
          id: 'table-example',
          component: DataTableExample,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'Table Example',
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
