import packageJSON from '../package.json';

export default () => {
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
    initialize(vcsApp) {
      vcsApp.contextMenuManager.addEventHandler(async (event) => {
        const actions = [
          {
            id: 'foo2',
            name: 'Log Position',
            icon: '$vcsInfo',
            callback() {
              console.log(event.positionOrPixel);
            },
          },
        ];
        if (event.feature) {
          actions.push({
            id: 'foo',
            name: 'Log Feature',
            icon: '$vcsInfo',
            callback() {
              console.log('feature right clicked');
              console.log(event.feature);
            },
          });
        }
        return actions;
      }, packageJSON.name);
    },
  };
};
