import { WindowSlot, createToggleAction, ButtonLocation } from '@vcmap/ui';
import packageJSON from '../package.json';
import component from './ViewpointExample.vue';

export default function viewpointExamplePlugin() {
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
      const { action, destroy } = createToggleAction(
        {
          name: 'Viewpoint Example',
          icon: '$vcsPoi',
        },
        {
          id: 'viewpoint-component-example',
          state: {
            headerTitle: 'Viewpoint Example',
            headerIcon: '$vcsPoi',
          },
          component,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        vcsApp.windowManager,
        packageJSON.name,
      );
      vcsApp.navbarManager.add(
        { id: 'viewpoint-component-example', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this.destroy = destroy;
    },
    getState() {
      return {
        test: 'mySUperTest',
      };
    },
  };
}
