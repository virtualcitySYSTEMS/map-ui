import { TransformationMode } from '@vcmap/core';

const messages = {
  navbar: {
    maps: {
      CesiumMap: 'Enable 3D map',
      OpenlayersMap: 'Enable 2D map',
      ObliqueMap: 'Enable oblique imagery map',
    },
    menu: {
      tooltip: 'Menu',
    },
    share: {
      tooltip: 'Share current view of the map',
    },
  },
  content: {
    title: 'Content',
    empty: 'Currently there are no entries available.',
    search: {
      placeholder: 'Search elements',
    },
    infoAction: {
      title: 'Further informationen',
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
    obliqueLeftTooltip: 'Rotate view to left',
    obliqueRightTooltip: 'Rotate view to right',
    zoomInTooltip: 'Zoom in',
    zoomOutTooltip: 'Zoom out',
    pitchTooltip: 'Camera pitch: {0}°',
    overviewMapTooltip: 'Show overview map',
    homeButton: 'Go to home view',
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
      help: 'Show help',
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
    },
    editor: {
      [TransformationMode.TRANSLATE]: 'Translate features',
      [TransformationMode.ROTATE]: 'Rotate features',
      [TransformationMode.SCALE]: 'Scale features',
      [TransformationMode.EXTRUDE]: 'Extrude features',
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
    },
    vectorProperties: {
      header: 'Vector properties',
      altitudeMode: 'Altitude mode',
      clampToGround: 'Clamp to ground',
      absolute: 'Absolute',
      relativeToGround: 'Relative to ground',
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
      baseUrl: 'Base URL',
      extrudedHeight: 'Extrusion',
      skirt: 'Skirts',
      modelScale: 'Model scale',
    },
    validation: {
      allowedRange: 'Allowed value range',
      notValid: 'Input not valid',
      required: 'Input is required',
    },
  },
  settings: {
    title: 'Settings',
    tooltip: 'Configure settings',
    languageSelector: 'Language',
    theme: {
      title: 'Color theme',
      dark: 'Dark',
      light: 'Light',
    },
  },
  help: {
    title: 'Help',
    tooltip: 'Open external help page in new browser tab',
  },
  featureInfo: {
    activateToolTitle: 'Enable Info Tool',
    deactivateToolTitle: 'Disable Info Tool',
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
    zoomToAll: 'Zoom to all',
  },
  toolbox: {
    flight: 'flight',
    miscellaneous: 'miscellaneous',
  },
  footer: {
    title: 'Footer',
    attributions: {
      title: 'Attributions',
      tooltip: 'Open attributions window',
      empty: 'Currently there are no attribution entries available.',
    },
    imprint: {
      title: 'Imprint',
      tooltip: 'Open imprint window',
    },
    dataProtection: {
      title: 'Data Protection',
      tooltip: 'Open data protection window',
    },
    positionDisplay: {
      title: 'Position display',
      projection: 'Select projection',
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
