import { en } from 'vuetify/locale';

const messages = {
  $vuetify: {
    ...en,
    dataIterator: {
      ...en.dataIterator,
      rowsPerPageText: 'Items per page:',
      pageText: '{0}-{1} of {2}',
    },
  },
  navbar: {
    maps: {
      CesiumMap: '3D map',
      OpenlayersMap: '2D map',
      ObliqueMap: 'Oblique imagery map',
    },
    menu: {
      tooltip: 'Menu',
    },
    share: {
      tooltip: 'Share current view of the map',
    },
  },
  mobileMenu: { title: 'Menu' },
  content: {
    title: 'Content',
    empty: 'Currently there are no entries available.',
    search: {
      placeholder: 'Search elements',
    },
    helpAction: {
      title: 'Open help',
    },
    infoAction: {
      title: 'Further information',
    },
    viewpointAction: {
      title: 'Go to viewpoint',
    },
    styleAction: {
      title: 'Open style selector',
    },
    layerExtentAction: {
      name: 'Zoom to extent',
      title: 'Zoom to layer extent',
    },
  },
  navigation: {
    rotateButton: 'Rotate view',
    obliqueLeftTooltip: 'Rotate view to left',
    obliqueRightTooltip: 'Rotate view to right',
    zoomInTooltip: 'Zoom in',
    zoomOutTooltip: 'Zoom out',
    pitchTooltip: 'Camera pitch: {0}°',
    overviewMapTooltip: 'Overview map',
    homeButton: 'Go to home view',
    compass: {
      alignEast: 'Align east',
      alignNorth: 'Align north',
      alignSouth: 'Align south',
      alignWest: 'Align west',
    },
    locator: {
      errorAccess: 'Access to your location has been denied',
      errorCurrentPosition:
        'Unfortunately, your current position could not be recorded',
      errorConnection:
        'The connection was lost while your position was being determined',
      errorPosition: 'Unfortunately, your position cannot be recorded',
    },
    obliqueFallback: {
      message:
        'There is no data for the current position and selected data set.',
      title: 'Missing Data',
    },
  },
  categoryManager: {
    title: 'My Workspace',
    tooltip: 'My Workspace',
  },
  collectionManager: {
    more: 'Show all...',
    less: 'Show less...',
    empty: 'There are no entries yet.',
  },
  components: {
    pin: 'Dock window',
    close: 'Close window',
    add: 'Add',
    apply: 'Apply',
    cancel: 'Cancel',
    import: {
      submit: 'Import',
      fileDrop: 'Drop files here',
      failure: 'File {fileName} could not be parsed.',
      predicateFailure: '{0} features to not fullfill requirements.',
      addFailure: '{0} feature are already exist.',
      featuresAdded: '{0} feature imported.',
      nothingAdded: 'No features could be imported.',
    },
    vcsFormSection: {
      help: 'Toggle help text',
    },
    vcsTable: {
      key: 'Name',
      value: 'Value',
    },
    vcsDataTable: {
      searchbarPlaceholder: 'Name, value, ...',
      itemsPerPage: 'per page',
      ofItems: 'of',
      nextPage: 'Next page',
      formerPage: 'Previous page',
      noDataPlaceholder: 'No data available',
      noResultsPlaceholder: 'No matching records found',
    },
    style: {
      fill: 'Fill',
      stroke: 'Stroke',
      reset: 'Reset',
      lineWidth: 'Line width',
      type: 'Type',
      points: 'Points',
      radius: 'Radius',
      radius2: 'Radius2',
      angle: 'Angle',
      rotation: 'Rotation',
      scale: 'Scale',
      opacity: 'Opacity',
      image: 'Symbol',
      icon: 'Icon',
      shape: 'Shape',
      presets: 'Presets',
      circle: 'Circle',
      square: 'Square',
      rectangle: 'Rectangle',
      triangle: 'Triangle',
      star: 'Star',
      cross: 'Cross',
      x: 'X',
      custom: 'Custom',
      bold: 'Bold',
      italic: 'Italic',
      text: 'Text',
      enterText: 'Enter text here',
      offset: 'Offset',
    },
    flight: {
      general: 'Flight settings',
      name: 'Name (ID)',
      title: 'Title',
      titlePlaceholder: 'Title of flight',
      interpolation: 'Interpolation',
      duration: 'Total flight duration',
      spline: 'Spline',
      linear: 'Linear',
      loop: 'Loop',
      anchors: 'Flight anchors',
      hidePath: 'Visualization of flight path',
      addAnchor: 'Add current view as new anchor',
      removeAnchor: 'Remove anchor',
      editAnchor: 'Edit anchor',
      zoomToAnchor: 'Zoom to anchor',
      noAnchor: 'No flight anchor available yet.',
      invalidDuration: 'The total flight duration must be greater zero!',
      zoom: 'Zoom to extent',
      export: 'Export flight',
      exportPath: 'Export flight path',
    },
    splashScreen: {
      name: 'Splash Screen',
      checkBoxText:
        'Please accept the [Conditions](https://vc.systems/) to continue',
      buttonTitle: 'Continue',
      dontShowAgain: "Don't show this message again",
    },
    customScreen: {
      name: 'Custom Screen',
    },
    viewpoint: {
      name: 'Name (ID)',
      title: 'Title',
      titlePlaceholder: 'Title of viewpoint',
      groundPosition: 'Ground position',
      cameraPosition: 'Camera position',
      distance: 'Distance',
      heading: 'Azimuth',
      pitch: 'Pitch',
      roll: 'Roll',
      animate: 'Animate',
      duration: 'Animation duration',
      general: 'General settings',
      positionAndOrientation: 'Position & Orientation',
      updateFromView: 'Apply current map position',
      sync: 'Turn on synchronization of the camera',
      syncOff: 'Turn off synchronization for editing',
      finiteNumber: 'Finite number is required!',
      positiveNumber: 'Positive number is required!',
    },
    coordinate: {
      outOfRange: 'Value out of valid range!',
    },
    extent: {
      title: 'Extent',
      projection: 'Projection',
      min: 'Min',
      max: 'Max',
      show: 'Show extent in map',
      hide: 'Hide extent in map',
      create: 'Draw new extent in map',
      zoom: 'Zoom to extent',
      invalid: 'Coordinates do not result in a valid extent!',
      editVertices: 'Edit extent corners',
      translate: 'Translate extent',
      toggle: 'Toggle extent',
    },
    projection: {
      title: 'Coordinate reference system',
      epsg: 'Code',
      proj4: 'Proj4',
      proj4Tooltip: 'Request EPSG definition from server',
      alias: 'Alias',
      epsgIoRequestFailed: 'Requesting epsg failed!',
      invalidEpsg: 'EPSG code is invalid!',
      invalidProj4: 'Proj4 string is invalid!',
    },
    editor: {
      translate: 'Translate features',
      rotate: 'Rotate features',
      scale: 'Scale features',
      extrude: 'Extrude features',
      header: 'Transform',
      placeOnTerrain: 'Place on terrain',
      cw: 'Rotate 90° clockwise',
      ccw: 'Rotate 90° counter clockwise',
      angle: 'Angle',
      edit: 'Edit geometry',
      modifyHeader: 'Modify',
      modifyInfo:
        'For modifying the selected feature(s), click on one of the icons in the header above.',
      styleHeader: 'Style',
      snapping: {
        title: 'Snapping',
        help: 'Snapping can be temporarily disabled by holding the CTRL key.',
        orthogonalTooltip: 'Orthogonal snapping to horizontal edges.',
        parallelTooltip: 'Parallel snapping to horizontal edges.',
        vertexTooltip: 'Snap to drawn vertices.',
        edgeTooltip: 'Snap to drawn edges.',
      },
    },
    vectorProperties: {
      header: 'Vector properties',
      altitudeMode: 'Altitude mode',
      clampToGround: 'Drape on surface',
      clampToTerrain: 'Drape on terrain',
      clampTo3DTiles: 'Drape on objects',
      absolute: 'Absolute',
      relativeToGround: 'Relative to surface',
      relativeToTerrain: 'Relative to terrain',
      relativeTo3DTiles: 'Relative to objects',
      groundLevel: 'Ground level',
      classificationType: 'Classification',
      none: 'None',
      both: 'Both',
      cesium3DTile: '3D Tiles',
      terrain: 'Terrain',
      heightAboveGround: 'Height above ground',
      allowPicking: 'Allow picking',
      scaleByDistance: 'Scale by distance',
      eyeOffset: 'Eye offset',
      storeys: 'Storeys',
      storeyHeights: 'Storey height(s)',
      aboveGround: 'Above ground',
      belowGround: 'Below ground',
      modelUrl: 'Model URL',
      modelHeading: 'Model heading',
      modelPitch: 'Model pitch',
      modelRoll: 'Model roll',
      modelAutoScale: 'Model auto scale',
      baseUrl: 'Base URL',
      extrudedHeight: 'Extrusion',
      skirt: 'Skirts',
      modelScale: 'Model scale',
      help: {
        clampToGround:
          'Drape on any surface (such as terrain, mesh or buildings)',
        clampToTerrain: 'Only drape onto the terrain.',
        clampTo3DTiles: 'Only drape on objects (such as a mesh or buildings)',
        absolute:
          'Every vertex is drawn at its 3D position, not applicable to 2D features',
        relativeToGround:
          'Relative to any surface (such as terrain, mesh or buildings)',
        relativeToTerrain: 'Only relative to the terrain',
        relativeTo3DTiles:
          'Only relative to objects (such as a mesh or buildings)',
      },
    },
    validation: {
      allowedRange: 'Allowed value range',
      notValid: 'Input not valid',
      required: 'Input is required',
    },
  },
  settings: {
    title: 'Settings',
    tooltip: '',
    languageSelector: 'Language',
    displayQuality: {
      title: 'Display Settings',
      level: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      },
    },
    theme: {
      title: 'Color theme',
      dark: 'Dark',
      light: 'Light',
    },
  },
  help: {
    title: 'Help',
    tooltip: '',
  },
  featureInfo: {
    activateToolTitle: 'Query information',
    deactivateToolTitle: 'Query information',
    cluster: {
      headerTitle: 'Group information',
      expand: 'Show information list',
      collapse: 'Collapse information list',
      empty: 'No information available',
    },
    deepPicking: {
      title: "What's here?",
      headerTitle: 'Available information',
    },
  },
  legend: {
    title: 'Legend',
    tooltip: 'Legend',
    empty: 'Currently there are no legend entries available.',
    openInNew: 'Open in new tab',
    defaultLabelText: 'Text',
  },
  search: {
    title: 'Search',
    tooltip: 'Search',
    select: 'Select result item',
    placeholder: 'Search for address or landmark/point of interest',
    zoomToFeatureAction: 'Zoom to result',
    zoomToAllMobile: 'Zoom to all',
    zoomToAll: 'Zoom to all',
  },
  toolbox: {
    title: 'Toolbox',
    flight: 'flight',
    miscellaneous: 'miscellaneous',
  },
  footer: {
    title: 'Footer',
    attributions: {
      title: 'Attributions',
      tooltip: 'Show attributions',
      empty: 'Currently there are no attribution entries available.',
    },
    imprint: {
      title: 'Imprint',
      tooltip: '',
    },
    dataProtection: {
      title: 'Data Protection',
      tooltip: '',
    },
    positionDisplay: {
      title: 'Query map coordinates',
      projection: 'Select coordinate reference system',
    },
    oblique: {
      template: 'Oblique image: {{ name }} - {{ viewDirection }}',
      north: 'north',
      east: 'east',
      south: 'south',
      west: 'west',
      nadir: 'nadir',
    },
    mobile: {
      rotationWarning: 'Rotate to use all features',
    },
  },
  notification: {
    error: 'Error',
    warning: 'Warning',
    information: 'Information',
    success: 'Success',
  },
  datePicker: {
    today: 'Today',
  },
  list: {
    selectAll: 'Select all',
    clearSelection: 'Clear selection',
    renameItem: 'Rename item',
    deleteItem: 'Remove item',
    editItem: 'Edit item',
    import: 'Import',
    export: 'Export selection',
    delete: 'Delete selection',
    edit: 'Edit selection',
  },
  flight: {
    player: 'Player',
    playTooltip: 'Play this flight',
    pauseTooltip: 'Pause this flight at the current position',
    stopTooltip: 'Stop playing this flight',
    forwardFastTooltip: 'Fast forward playing',
    backwardFastTooltip: 'Fast backward playing',
    forwardStepTooltip: 'Step forward to next position',
    backwardStepTooltip: 'Step backward to previous position',
  },
};

export default messages;
