import { WindowSlot, createToggleAction, ButtonLocation } from '@vcmap/ui';
import component from './notifierTester.vue';

export default function createNotifierPlugin() {
  return {
    name: 'notifier',
    initialize(vcsApp) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Notifier',
        },
        {
          id: 'notifier-editor',
          state: {
            headerTitle: 'Notifier Editor',
          },
          component,
          slot: WindowSlot.DYNAMIC_LEFT,
        },
        vcsApp.windowManager,
        'notifier',
      );
      vcsApp.navbarManager.add(
        { id: 'notifier', action },
        'notifier',
        ButtonLocation.TOOL,
      );
      this.destroy = destroy;
    },
  };
}
