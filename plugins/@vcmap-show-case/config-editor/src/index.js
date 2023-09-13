import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import packageJSON from '../package.json';
import ConfigEditor from './ConfigEditor.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function configEditor() {
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
          name: 'Config Editor',
        },
        {
          id: 'config-editor',
          state: {
            headerTitle: 'Config Editor',
          },
          component: ConfigEditor,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: 'config-editor', action },
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
