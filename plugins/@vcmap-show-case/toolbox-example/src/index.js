import { ButtonLocation, ToolboxType } from '@vcmap/ui';
import { reactive, ref, watch } from 'vue';
import packageJSON from '../package.json';
import {
  createDummyTriStateAction,
  dummyToolboxAction,
} from './dummyToolboxActions.js';

function createToolboxChanger(app) {
  const action = reactive({
    name: 'Toolbox Changer',
    active: false,
    callback() {
      if (app.toolboxManager.toolboxName !== packageJSON.name) {
        app.toolboxManager.toolboxName = packageJSON.name;
      } else {
        app.toolboxManager.setDefaultToolboxName();
      }
    },
  });

  const destroy = app.toolboxManager.toolboxNameChanged.addEventListener(
    (toolboxName) => {
      action.active = toolboxName === packageJSON.name;
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
export default async function toolboxExample() {
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
    initialize(app) {
      const { action, destroy } = createToolboxChanger(app);
      app.navbarManager.add(
        { id: 'toolbox-changer', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      let toolboxListener = () => {};
      if (app.toolboxManager.has('featureInfo')) {
        app.toolboxManager
          .get('featureInfo')
          ?.toolboxNames.push(packageJSON.name);
      } else {
        toolboxListener = app.toolboxManager.added.addEventListener(
          (component) => {
            if (component.id === 'featureInfo') {
              component.toolboxNames.push(packageJSON.name);
            }
          },
        );
      }
      this._destroyToolboxChanger = [destroy, toolboxListener];

      const changedToolboxComponentExampleOptions = {
        id: 'namedDingleSelect',
        type: ToolboxType.SINGLE,
        toolboxNames: [packageJSON.name],
        action: {
          name: 'select',
          title: 'single select',
          icon: 'mdi-eye',
          active: false,
          disabled: false,
          callback() {
            this.disabled = true;
            setTimeout(() => {
              this.disabled = false;
            }, 2000);
          },
        },
      };
      app.toolboxManager.add(
        changedToolboxComponentExampleOptions,
        packageJSON.name,
      );
    },
    onVcsAppMounted(app) {
      const disabled = ref(false);

      /**
       * A toolbox button with toggle state
       * Toggles disabled state of the other toolbox elements below (see watch)
       * @type {import("@vcmap/ui").SingleToolboxComponentOptions}
       */
      const singleToolboxComponentExampleOptions = {
        id: 'singleToolboxExample',
        type: ToolboxType.SINGLE,
        action: {
          name: 'single',
          title: 'single toolbox example',
          icon: 'mdi-numeric-1-box',
          active: false,
          callback() {
            this.active = !this.active;
            disabled.value = this.active;
            this.icon = this.active
              ? 'mdi-numeric-1-box-outline'
              : 'mdi-numeric-1-box';
          },
        },
      };
      app.toolboxManager.add(
        singleToolboxComponentExampleOptions,
        packageJSON.name,
      );

      /**
       * @type {import("@vcmap/ui").ToolboxSelectAction}
       */
      const selectToolboxAction = {
        name: 'select',
        title: 'select toolbox example',
        ...dummyToolboxAction,
        disabled: false,
        tools: [
          {
            name: 'pen',
            title: 'select item 1',
            icon: 'mdi-numeric-1-box',
          },
          {
            name: 'object',
            title: 'select item 2',
            icon: 'mdi-numeric-2-box',
          },
        ],
      };

      /**
       * A select toolbox button with two tools
       * @type {import("@vcmap/ui").SelectToolboxComponentOptions}
       */
      const selectToolboxComponent = {
        id: 'selectToolboxExample',
        type: ToolboxType.SELECT,
        action: selectToolboxAction,
      };
      app.toolboxManager.add(selectToolboxComponent, packageJSON.name);

      /**
       * A group toolbox button with three group items
       * @type {import("@vcmap/ui").GroupToolboxComponentOptions}
       */
      const groupToolboxComponentExampleOptions = {
        id: 'groupToolboxExample',
        type: ToolboxType.GROUP,
        icon: 'mdi-numeric',
        disabled: false,
        title: 'group toolbox example',
      };
      app.toolboxManager.add(
        groupToolboxComponentExampleOptions,
        packageJSON.name,
      );

      /**
       * @type {Array<import("@vcmap/ui").ButtonComponentOptions>}
       */
      const buttonComponents = [
        {
          id: 'group-item-1',
          action: {
            name: 'group-action-1',
            title: 'group action 1',
            icon: 'mdi-numeric-1-box',
            active: false,
            callback() {
              this.active = !this.active;
            },
          },
        },
        {
          id: 'group-item-2',
          action: {
            name: 'group-action-2',
            title: 'group action 2',
            icon: 'mdi-numeric-2-box',
            active: false,
            callback() {
              this.active = !this.active;
            },
          },
        },
        {
          id: 'group-item-3',
          action: {
            name: 'group-action-3',
            title: 'group action 3',
            icon: 'mdi-numeric-3-box',
            active: false,
            disabled: true,
            callback() {
              this.active = !this.active;
            },
          },
        },
      ];
      const groupButtonManager = app.toolboxManager.get(
        'groupToolboxExample',
      ).buttonManager;
      buttonComponents.forEach((b) =>
        groupButtonManager.add(b, packageJSON.name),
      );

      /**
       * Updating disabled state of select and group toolbox button
       * @type {import("vue").WatchStopHandle}
       * @private
       */
      this._stopWatching = watch(
        () => disabled.value,
        () => {
          app.toolboxManager.get(selectToolboxComponent.id).action.disabled =
            disabled.value;
          app.toolboxManager.get(
            groupToolboxComponentExampleOptions.id,
          ).disabled = disabled.value;
        },
      );

      const { action, destroy } = createDummyTriStateAction(app);
      /**
       * A toolbox button with tristate
       * @type {import("@vcmap/ui").SingleToolboxComponentOptions}
       */
      const tristateButton = {
        id: 'tristateExample',
        type: ToolboxType.SINGLE,
        action,
      };
      app.toolboxManager.add(tristateButton, packageJSON.name);

      this._destroyAction = destroy;
    },
    destroy() {
      this._stopWatching();
      this._destroyToolboxChanger.forEach((cb) => cb());
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
