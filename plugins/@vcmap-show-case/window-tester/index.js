import { ButtonLocation, createToggleAction, ToolboxType } from '@vcmap/ui';
import packageJSON from './package.json';
import { getToolboxData } from './toolbox-data.js';
import windowExample from './WindowExample.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function windowTester() {
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
          name: 'Window Tester',
        },
        {
          id: 'window-tester',
          state: {
            headerTitle: 'Window Tester',
          },
          component: windowExample,
          position: {
            left: '60%',
            right: '10%',
            top: '10%',
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: 'window-tester', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      const { toolboxData, destroy: destroyToolboxData } = getToolboxData(app);
      toolboxData.forEach(
        ([{ buttonComponents, ...toolboxComponentOptions }, owner]) => {
          let group;
          if (app.toolboxManager.has(toolboxComponentOptions.id)) {
            group = app.toolboxManager.get(toolboxComponentOptions.id);
          } else {
            group = app.toolboxManager.add(toolboxComponentOptions, owner);
          }
          if (group.type === ToolboxType.GROUP && buttonComponents) {
            buttonComponents.forEach((c) => group.buttonManager.add(c, owner));
          }
        },
      );
      this._destroyAction = [destroy, destroyToolboxData];
    },
    destroy() {
      if (this._destroyActions) {
        this._destroyActions.forEach((cb) => cb());
        this._destroyActions = null;
      }
    },
  };
}
