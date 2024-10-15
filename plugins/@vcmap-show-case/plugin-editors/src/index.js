import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import packageJSON from '../package.json';
import component from './PluginEditors.vue';
/**
 * @returns {VcsPlugin}
 */
export default function pluginEditors() {
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
    async initialize(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Plugin Editors',
          title: 'Overview of Plugins with editors.',
        },
        {
          id: packageJSON.name,
          component,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'Plugin Editors',
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: packageJSON.name, action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this._destroyAction = destroy;
    },
    getConfigEditors() {
      return [];
    },
    toJSON() {
      return {};
    },
    destroy() {
      this._destroyAction();
    },
  };
}
