import { createToggleAction, ButtonLocation, WindowSlot } from '@vcmap/ui';
import packageJSON from '../package.json';
import WizardExample from './WizardExample.vue';

/**
 * @returns {VcsPlugin}
 */
export default async () => {
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
    onVcsAppMounted(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Wizard Example',
          icon: '$vcsWand',
          title: 'Wizard Example Plugin',
        },
        {
          id: 'wizard-example',
          component: WizardExample,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'VCS Wizard',
            headerIcon: '$vcsWand',
            styles: { width: '350px', height: 'auto' },
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: 'wizard-example', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this._destroyAction = destroy;
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
};
