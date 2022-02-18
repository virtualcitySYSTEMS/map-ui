import { windowSlot } from '../../src/modules/window-manager/windowManager.js';
import Categories from './Categories.vue';
import { createToggleAction } from '../../src/actionHelper.js';
import { ButtonLocation } from '../../src/modules/component-manager/buttonManager.js';

/**
 * @returns {VcsPlugin}
 */
export default async function categoryTest() {
  return {
    name: '@vcmap/categoryTest',
    onVcsAppMounted(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Category Editor',
          icon: '$vcsPen',
        },
        {
          id: 'category-editor',
          component: Categories,
          slot: windowSlot.DETACHED,
          position: {
            width: 500,
          },
        },
        app.windowManager,
        '@vcmap/categoryTest',
      );
      app.navbarManager.add({
        id: 'category-editor',
        location: ButtonLocation.TOOL,
        action,
      }, '@vcmap/categoryTest');
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
