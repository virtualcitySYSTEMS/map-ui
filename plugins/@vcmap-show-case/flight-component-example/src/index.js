import { WindowSlot, createToggleAction, ButtonLocation } from '@vcmap/ui';
import packageJSON from '../package.json';
import component from './FlightExample.vue';

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
          name: 'Flight Example',
          icon: '$vcsPoi',
        },
        {
          id: 'flight-component-example',
          state: {
            headerTitle: 'Flight Example',
            headerIcon: '$vcsPoi',
          },
          component,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        vcsApp.windowManager,
        packageJSON.name,
      );
      vcsApp.navbarManager.add(
        { id: 'flight-component-example', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this.destroy = destroy;
    },
  };
}
