import { ButtonLocation, createToggleAction } from '@vcmap/ui';
import CustomIconsExample from './CustomIconsExample.vue';
import packageJSON from '../package.json';

export default async function customIconExample() {
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
          name: 'Custom icons example',
        },
        {
          id: 'custom-icons-example',
          state: {
            headerTitle: 'Custom icons example',
          },
          component: CustomIconsExample,
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: 'custom-icons-example', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this._destoryAction = [destroy];
    },
    destroy() {
      if (this._destroyActions) {
        this._destroyActions.forEach((cb) => cb());
        this._destroyActions = null;
      }
    },
  };
}
