/* eslint-disable no-console */
import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
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
          icon: '$vcsPointSelect',
        },
        {
          id: '228',
          component: mySuperComponent,
          slot: WindowSlot.DETACHED,
          position: {
            width: 1200,
          },
        },
        app.windowManager,
        '@vcmap/example',
      );
      this._destroyAction = destroy;
      app.navbarManager.add(
        {
          action,
        },
        '@vcmap/example',
        ButtonLocation.TOOL,
      );
      const miscGroup = app.toolboxManager.get('miscellaneous');
      miscGroup.buttonManager.add({
        id: 'example',
        action: {
          name: 'example',
          title: 'example',
          icon: 'mdi-circle-small',
          active: false,
          callback() { this.active = !this.active; },
        },
      }, '@vcmap/example');
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
