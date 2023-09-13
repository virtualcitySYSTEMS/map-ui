import { WindowSlot, createToggleAction, ButtonLocation } from '@vcmap/ui';
import packageJSON from '../package.json';
import component from './NotifierTester.vue';

export default function createNotifierPlugin() {
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
          name: 'Notifier Tester',
          icon: '$vcsComment',
        },
        {
          id: 'notifier-tester',
          state: {
            headerTitle: 'Notifier Tester',
            headerIcon: '$vcsComment',
          },
          component,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        vcsApp.windowManager,
        packageJSON.name,
      );
      vcsApp.navbarManager.add(
        { id: 'notifier', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this.destroy = destroy;
    },
  };
}
