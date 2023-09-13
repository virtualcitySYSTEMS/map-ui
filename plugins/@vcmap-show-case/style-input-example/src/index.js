import { WindowSlot, createToggleAction, ButtonLocation } from '@vcmap/ui';
import packageJSON from '../package.json';
import component from './StyleExample.vue';

export default function createStyleExamplePlugin() {
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
          name: 'Style Example',
          icon: '$vcsColorSwatch',
        },
        {
          id: 'style-input-example',
          state: {
            headerTitle: 'Style example',
            headerIcon: '$vcsColorSwatch',
          },
          component,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        vcsApp.windowManager,
        packageJSON.name,
      );
      vcsApp.navbarManager.add(
        { id: 'style', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this.destroy = destroy;
    },
  };
}
