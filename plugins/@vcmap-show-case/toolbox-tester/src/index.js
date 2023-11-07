import { ButtonLocation, ToolboxType } from '@vcmap/ui';
import { reactive } from 'vue';
import { name, version, mapVersion } from '../package.json';
import { getToolboxData } from './toolboxData.js';

function createToolboxChanger(app) {
  const action = reactive({
    name: 'Toolbox Changer',
    active: false,
    callback() {
      if (app.toolboxManager.toolboxName !== name) {
        app.toolboxManager.toolboxName = name;
      } else {
        app.toolboxManager.setDefaultToolboxName();
      }
    },
  });

  const destroy = app.toolboxManager.toolboxNameChanged.addEventListener(
    (toolboxName) => {
      action.active = toolboxName === name;
    },
  );

  return {
    action,
    destroy,
  };
}

/**
 * @returns {VcsPlugin}
 */
export default async function windowTester() {
  return {
    get name() {
      return name;
    },
    get version() {
      return version;
    },
    get mapVersion() {
      return mapVersion;
    },
    initialize(app) {
      const { action, destroy } = createToolboxChanger(app);
      app.navbarManager.add(
        { id: 'toolbox-tester', action },
        name,
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
      let toolboxListener = () => {};
      if (app.toolboxManager.has('featureInfo')) {
        app.toolboxManager.get('featureInfo')?.toolboxNames.push(name);
      } else {
        toolboxListener = app.toolboxManager.added.addEventListener(
          (component) => {
            if (component.id === 'featureInfo') {
              component.toolboxNames.push(name);
            }
          },
        );
      }
      this._destroyAction = [destroy, destroyToolboxData, toolboxListener];
    },
    i18n: {
      de: {
        windowTester: {
          title: 'Fenster Tester',
        },
      },
      en: {
        windowTester: {
          title: 'Window Tester',
        },
      },
    },
    destroy() {
      if (this._destroyActions) {
        this._destroyActions.forEach((cb) => cb());
        this._destroyActions = null;
      }
    },
  };
}
