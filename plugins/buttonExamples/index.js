import { createToggleAction } from '../../src/actionHelper.js';
import { windowSlot } from '../../src/modules/window-manager/windowManager.js';
import { ButtonLocation } from '../../src/modules/component-manager/buttonManager.js';
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
          slot: windowSlot.DETACHED,
          position: {
            width: 500,
          },
        },
        app.windowManager,
        'buttonExamples',
      );
      app.navbarManager.add({
        location: ButtonLocation.CONTENT,
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
