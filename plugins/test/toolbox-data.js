// eslint-disable-next-line import/prefer-default-export
export const toolboxData = [
  [
    {
      id: 'select',
      buttonComponents: [
        {
          id: 'select',
          action: {
            name: 'select',
            title: 'select',
            icon: '$vcsPointSelect',
            active: false,
            callback() { this.active = !this.active; },
          },
        },
      ],
    },
    '@vcmap/test',
  ],
  [
    {
      id: 'multiSelect',
      icon: '$vcsPen',
      title: 'multi select',
      buttonComponents: [
        {
          id: 'pen',
          action: {
            name: 'pen',
            title: 'Item 1',
            icon: '$vcsPen',
            active: false,
            callback() { this.active = !this.active; },
          },
        },
        {
          id: 'object',
          action: {
            name: 'object',
            title: 'Item 2',
            icon: '$vcsObjectSelect',
            active: false,
            callback() { this.active = !this.active; },
          },
        },
      ],
    },
    '@vcmap/test',
  ],
  [
    {
      id: 'measurement',
      icon: '$vcsDimensionsHouse',
      title: 'measurement',
      buttonComponents: [
        {
          id: 'distance',
          action: {
            name: 'distance',
            title: '2D distance',
            icon: '$vcs2dDistance',
            active: false,
            callback() { this.active = !this.active; },
          },
        },
        {
          id: 'area',
          action: {
            name: 'area',
            title: '2D area',
            icon: '$vcs2dArea',
            active: false,
            callback() { this.active = !this.active; },
          },
        },
      ],
    },
    '@vcmap/test',
  ],
  [
    {
      id: 'toggle',
      buttonComponents: [
        {
          id: 'split',
          action: {
            name: 'split',
            title: 'split view',
            icon: '$vcsSplitView',
            active: false,
            callback() { this.active = !this.active; },
          },
        },
      ],
    },
    '@vcmap/test',
  ],
  [
    {
      id: 'flight',
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
