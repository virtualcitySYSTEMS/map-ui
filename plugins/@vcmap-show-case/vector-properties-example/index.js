import { WindowSlot, createToggleAction, ButtonLocation } from '@vcmap/ui';
import packageJSON from './package.json';
import component from './VectorPropertiesExample.vue';

export default function createVectorPropertiesExamplePlugin() {
  return {
    get name() {
      return packageJSON.name;
    },
    get version() {
      return packageJSON.version;
    },
    get vcMapVersion() {
      return packageJSON.vcMapVersion;
    },
    initialize(vcsApp) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Vector Properties Example',
        },
        {
          id: 'vector-properties-example',
          state: {
            headerTitle: 'Vector Properties Example',
          },
          component,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        vcsApp.windowManager,
        packageJSON.name,
      );
      vcsApp.navbarManager.add(
        { id: 'vectorProperties', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this.destroy = destroy;
    },
  };
}
