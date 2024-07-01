import {
  ButtonLocation,
  createToggleAction,
  WindowSlot,
  VcsExtentEditor,
} from '@vcmap/ui';
import { Extent } from '@vcmap/core';
import { reactive } from 'vue';
import packageJSON from '../package.json';

/**
 * @returns {VcsPlugin}
 */
export default async function extentExample() {
  const modelValue = reactive(new Extent().toJSON());

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
          component: VcsExtentEditor,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'Extent Example',
            headerIcon: '$vcsBoundingBox',
          },
          props: {
            modelValue,
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
