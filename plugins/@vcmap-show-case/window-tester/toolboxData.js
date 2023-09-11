import { ToolboxType } from '@vcmap/ui';
import { reactive } from 'vue';
import WindowExampleContent from './WindowExampleContent.vue';
import packageJSON from './package.json';

const dummySelectAction = {
  active: false,
  currentIndex: 0,
  _stop() {
    console.log('stopping session', this._session);
    this._session = null;
    this.active = false;
  },
  _start() {
    const startSession = (tool) => ({ type: tool });
    this._session = startSession(this.tools[this.currentIndex].name);
    this.active = true;
    console.log('starting session', this._session);
  },
  callback() {
    if (this.active) {
      this._stop();
    } else {
      this._start();
    }
  },
  selected(index) {
    this.currentIndex = index;
    if (this.active) {
      this._session.type = this.tools[this.currentIndex].name;
      console.log('updating active session', this._session);
    } else {
      this._start();
    }
  },
};

function createDummyTriStateAction(app) {
  const windowComponent = {
    id: 'tri-state-example',
    state: {
      headerTitle: 'Example Session Toggle',
    },
    component: WindowExampleContent,
  };

  const action = reactive({
    name: 'tri-state-action',
    icon: 'mdi-triangle',
    active: false,
    background: false,
    callback() {
      if (this.active) {
        if (this.background) {
          return app.windowManager.add(windowComponent, '@vcmap/test');
        } else {
          app.windowManager.remove(windowComponent.id);
          this.active = false;
        }
      } else {
        this.active = true;
        return app.windowManager.add(windowComponent, '@vcmap/test');
      }
      return null;
    },
  });

  const listeners = [
    app.windowManager.added.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.active = true;
        action.background = false;
      }
    }),
    app.windowManager.removed.addEventListener(({ id }) => {
      if (id === windowComponent.id) {
        action.background = true;
      }
    }),
  ];

  const destroy = () => {
    if (app.windowManager.has(windowComponent.id)) {
      app.windowManager.remove(windowComponent.id);
    }
    listeners.forEach((cb) => cb());
  };

  return { action, destroy };
}

// eslint-disable-next-line import/prefer-default-export
export function getToolboxData(app) {
  const { action: triStateAction, destroy } = createDummyTriStateAction(app);

  const toolboxData = [
    [
      {
        id: 'singleSelect',
        type: ToolboxType.SINGLE,
        action: {
          name: 'select',
          title: 'single select',
          icon: '$vcsPointSelect',
          active: false,
          callback() {
            this.active = !this.active;
          },
        },
      },
      packageJSON.name,
    ],
    [
      {
        id: 'singleSelect2',
        type: ToolboxType.SINGLE,
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
      },
      packageJSON.name,
    ],
    [
      {
        id: 'multiSelect',
        type: ToolboxType.SELECT,
        action: {
          name: 'multiSelect',
          title: 'multi select',
          ...dummySelectAction,
          tools: [
            {
              name: 'pen',
              title: 'Item 1',
              icon: '$vcsPen',
            },
            {
              name: 'object',
              title: 'Item 2',
              icon: '$vcsObjectSelect',
            },
          ],
        },
      },
      packageJSON.name,
    ],
    [
      {
        id: 'measurement',
        type: ToolboxType.SELECT,
        action: {
          name: 'measurement',
          title: 'measurement',
          ...dummySelectAction,
          tools: [
            {
              name: 'distance',
              title: '2D distance',
              icon: '$vcs2dDistance',
            },
            {
              name: 'area',
              title: '2D area',
              icon: '$vcs2dArea',
            },
            {
              name: 'distance3D',
              title: '3D distance',
              icon: '$vcs3dDistance',
            },
            {
              name: 'area3D',
              title: '3D area',
              icon: '$vcs3dArea',
              disabled: true,
            },
          ],
        },
      },
      packageJSON.name,
    ],
    [
      {
        id: 'toggle',
        type: ToolboxType.SINGLE,
        action: triStateAction,
      },
      packageJSON.name,
    ],
    [
      {
        id: 'flight',
        type: ToolboxType.GROUP,
        icon: '$vcsVideoRecorder',
        title: 'flight',
        buttonComponents: [
          {
            id: 'flight',
            action: {
              name: 'flight',
              title: 'add flight',
              icon: 'mdi-camera-plus',
              active: false,
              callback() {
                this.active = !this.active;
              },
            },
          },
          {
            id: 'export',
            action: {
              name: 'export',
              title: 'export flight',
              icon: '$vcsExportFlight',
              disabled: true,
              active: false,
              callback() {
                this.active = !this.active;
              },
            },
          },
        ],
      },
      packageJSON.name,
    ],
    [
      {
        id: 'flight2',
        type: ToolboxType.GROUP,
        icon: '$vcsVideoRecorder',
        title: 'flight2',
        disabled: true,
        buttonComponents: [
          {
            id: 'flight',
            action: {
              name: 'flight',
              title: 'add flight',
              icon: 'mdi-camera-plus',
              active: false,
              callback() {
                this.active = !this.active;
              },
            },
          },
        ],
      },
      packageJSON.name,
    ],
    [
      {
        id: 'multiSelect2',
        type: ToolboxType.SELECT,
        action: {
          name: 'multiSelect',
          title: 'multi select',
          disabled: true,
          ...dummySelectAction,
          tools: [
            {
              name: 'pen',
              title: 'Item 3',
              icon: '$vcsPen',
            },
            {
              name: 'object',
              title: 'Item 4',
              icon: '$vcsObjectSelect',
            },
          ],
        },
      },
      packageJSON.name,
    ],
  ];

  return { toolboxData, destroy };
}
