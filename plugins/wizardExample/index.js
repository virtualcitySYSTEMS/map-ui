import { createToggleAction, ButtonLocation, WindowSlot } from '@vcmap/ui';
import WizardExample from './wizardExample.vue';

export default async () => {
  return {
    name: 'wizardExample',
    onVcsAppMounted(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'wizardExample',
          icon: '$vcsLegend',
          title: 'VCS Wizard Example',
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
        'wizardExample',
      );
      app.navbarManager.add(
        { id: 'wizard-example', action },
        'wizardExample',
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
