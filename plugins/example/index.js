/* eslint-disable no-console */
import { ButtonLocation, createToggleAction, WINDOW_POSITIONS, windowSlot } from '@vcmap/ui';
import mySuperComponent from './mySuperComponent.vue';

/**
 *
 * @param {PluginExampleConfig} config
 * @returns {VcsPlugin}
 */
export default async function (config) {
  return {
    name: '@vcmap/example',
    initialize(app) {
      console.log('initialize', app, config);
    },
    onVcsAppMounted(app) {
      console.log('onVcsAppMounted', app, config);
      // XXX supportedMaps: ['vcs.vcm.maps.Openlayers', 'vcs.vcm.maps.Cesium'],
      const { action, destroy } = createToggleAction(
        {
          name: 'Example',
        },
        {
          id: '228',
          component: mySuperComponent,
          slot: windowSlot.DYNAMIC_RIGHT,
          position: {
            width: 500,
          },
        },
        app.windowManager,
        '@vcmap/example',
      );
      this._destroyAction = destroy;
      app.navbarManager.add({
        location: ButtonLocation.TOOL,
        action,
      }, '@vcmap/example');
      app.windowManager.add({
        id: '228',
        component: mySuperComponent,
        position: WINDOW_POSITIONS.TOP_RIGHT,
        slot: windowSlot.DYNAMIC_RIGHT,
      }, '@vcmap/example');
      // app.toolboxManager.addToolboxGroup(
      //   {
      //     type: 'toggleButton',
      //     icon: '$vcsPointSelect',
      //     id: 15,
      //     active: true,
      //   },
      //   15,
      // );
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
