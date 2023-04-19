/* eslint-disable no-console */
import { ButtonLocation, createToggleAction, WindowSlot } from '@vcmap/ui';
import packageJSON from './package.json';
import mySuperComponent from './TextfieldsExample.vue';

/**
 *
 * @param {FormInputsExampleConfig} config
 * @returns {VcsPlugin}
 */
export default async function textfieldsExample(config) {
  return {
    get name() {
      return packageJSON.name;
    },
    get version() {
      return packageJSON.version;
    },
    get vcMapVersion() {
      return packageJSON.vcMapVersion;
    },
    initialize(app) {
      console.log('initialize', app, config);
    },
    onVcsAppMounted(app) {
      console.log('onVcsAppMounted', app, config);
      // XXX supportedMaps: ['vcs.vcm.maps.Openlayers', 'vcs.vcm.maps.Cesium'],
      const { action, destroy } = createToggleAction(
        {
          name: 'Textfields Example',
          icon: '$vcsPen',
        },
        {
          id: '228',
          component: mySuperComponent,
          slot: WindowSlot.DETACHED,
          state: {
            headerTitle: 'Textfields Example',
            headerIcon: '$vcsPen',
          },
          position: {
            width: 1200,
          },
        },
        app.windowManager,
        packageJSON.name,
      );
      this._destroyAction = destroy;
      app.navbarManager.add(
        {
          action,
        },
        packageJSON.name,
        ButtonLocation.TOOL,
      );
    },
    destroy() {
      if (this._destroyAction) {
        this._destroyAction();
        this._destroyAction = null;
      }
    },
  };
}
