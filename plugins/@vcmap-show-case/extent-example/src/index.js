import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import packageJSON from '../package.json';
import ExtentExample from './ExtentExample.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function extentExample() {
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
          name: 'Extent Example',
          title: 'Extent Example Plugin',
          icon: '$vcsBoundingBox',
        },
        {
          id: 'extent-example',
          component: ExtentExample,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'Extent Example',
            headerIcon: '$vcsBoundingBox',
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
