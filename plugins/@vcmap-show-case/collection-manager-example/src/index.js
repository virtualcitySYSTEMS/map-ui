import {
  ButtonLocation,
  createToggleAction,
  WindowSlot,
  CollectionManager,
} from '@vcmap/ui';
import packageJSON from '../package.json';
import CollectionManagerExample from './CollectionManagerExample.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function collectionManagerExample() {
  let collectionManager;

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
    get collectionManager() {
      return collectionManager;
    },
    initialize(app) {
      collectionManager = new CollectionManager(app);
      const { action, destroy } = createToggleAction(
        {
          name: 'Collection Manager Tester',
          title: 'Collection Manager Tester',
          icon: '$vcsPen',
        },
        {
          id: 'collection-editor',
          component: CollectionManagerExample,
          slot: WindowSlot.DETACHED,
          state: {
            headerTitle: 'Collection Manager Tester',
            headerIcon: '$vcsPen',
          },
          position: {
            width: 500,
          },
          provides: {
            collectionManager,
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add(
        { id: 'collection-editor', action },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
      this._destroyAction = destroy;
    },
    i18n: {
      de: {
        collectionManagerExample: {
          select: 'Collection',
          addFailed: 'Die gewählte Collection wurde bereits hinzugefügt!',
          addAction: 'Collection hinzufügen',
          clearAction: 'Manager leeren',
        },
      },
      en: {
        collectionManagerExample: {
          select: 'Collection',
          addFailed: 'The selected collection is already added!',
          addAction: 'Add collection to manager',
          clearAction: 'Clear Manager',
        },
      },
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
