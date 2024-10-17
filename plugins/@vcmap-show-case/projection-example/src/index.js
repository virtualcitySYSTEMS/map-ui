import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import packageJSON from '../package.json';
import ProjectionExample from './ProjectionExample.vue';

/**
 * @returns {VcsPlugin}
 */
export default async function projectionExample() {
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
    initialize(app) {
      const { action, destroy } = createToggleAction(
        {
          name: 'Projection Example',
          title: 'Projection Example Plugin',
          icon: '$vcsBoundingBox',
        },
        {
          id: 'projection-example',
          component: ProjectionExample,
          slot: WindowSlot.DYNAMIC_LEFT,
          state: {
            headerTitle: 'Projection Example',
            headerIcon: '$vcsBoundingBox',
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      app.navbarManager.add({ action }, packageJSON.name, ButtonLocation.TOOL);
      this._destroyAction = destroy;
    },
    i18n: {
      de: {
        projectionExample: {
          openDialog: 'Dialog öffnen',
          log: 'Log',
        },
      },
      en: {
        openDialog: 'Open Dialog',
        log: 'Log',
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
