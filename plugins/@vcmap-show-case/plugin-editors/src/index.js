import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import { name, version } from '../package.json';
import component from './PluginEditors.vue';
/**
 * @returns {VcsPlugin}
 */
export default function pluginEditors() {
  return {
    name,
    version,
    async initialize(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Plugin Editors',
          title: 'Overview of Plugins with editors.',
        },
        {
          id: name,
          component,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'Plugin Editors',
          },
        },
        app.windowManager,
        name,
      );
      app.navbarManager.add({ id: name, action }, name, ButtonLocation.TOOL);
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
