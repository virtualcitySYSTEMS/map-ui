import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import Categories from './Categories.vue';

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
          slot: WindowSlot.DETACHED,
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
