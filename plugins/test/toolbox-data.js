import { ToolboxType } from '@vcmap/ui';

const dummySelectAction = {
  active: false,
  currentIndex: 0,
  _stop() {
    console.log('stopping session', this._session);
    this._session = null;
    this.active = false;
  },
  _start() {
    const startSession = tool => ({ type: tool });
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

// eslint-disable-next-line import/prefer-default-export
export const toolboxData = [
  [
    {
      id: 'singleSelect',
      type: ToolboxType.SINGLE,
      action: {
        name: 'select',
        title: 'single select',
        icon: '$vcsPointSelect',
        active: false,
        callback() { this.active = !this.active; },
      },
    },
    '@vcmap/test',
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
    '@vcmap/test',
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
          },
        ],
      },
    },
    '@vcmap/test',
  ],
  [
    {
      id: 'toggle',
      type: ToolboxType.SINGLE,
      action: {
        name: 'split',
        title: 'split view',
        icon: '$vcsSplitView',
        active: false,
        callback() { this.active = !this.active; },
      },
    },
    '@vcmap/test',
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
            callback() { this.active = !this.active; },
          },
        },
        {
          id: 'export',
          action: {
            name: 'export',
            title: 'export flight',
            icon: '$vcsExportFlight',
            active: false,
            callback() { this.active = !this.active; },
          },
        },
      ],
    },
    '@vcmap/test',
  ],
];
