import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import ButtonExamples from './ButtonExamples.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function buttonExamples() {
  return {
    name: 'buttonExamples',
    onVcsAppMounted(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'buttonsExamples',
          icon: '$vcsTouch',
        },
        {
          id: 'button-examples',
          component: ButtonExamples,
          slot: WindowSlot.DETACHED,
          position: {
            width: 500,
          },
        },
        app.windowManager,
        'buttonExamples',
      );
      app.navbarManager.add({
        location: ButtonLocation.TOOL,
        action,
      }, 'buttonExamples');
      this._destroyAction = destroy;
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
