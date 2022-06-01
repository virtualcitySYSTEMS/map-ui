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
      const buttonComponents = [
        {
          id: 'distance3D',
          action: {
            name: 'distance3D',
            title: '3D distance',
            icon: '$vcs3dDistance',
            active: false,
            callback() { this.active = !this.active; },
          },
        },
        {
          id: 'area3D',
          action: {
            name: 'area3D',
            title: '3D area',
            icon: '$vcs3dArea',
            active: false,
            callback() { this.active = !this.active; },
          },
        },
      ];
      const measurementGroup = app.toolboxManager.requestGroup('measurement');
      buttonComponents.forEach(c => measurementGroup.buttonManager.add(c, '@vcmap/example'));
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
