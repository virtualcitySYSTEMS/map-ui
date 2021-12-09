/* eslint-disable no-console */
import { inject } from '@vue/composition-api';
import { WINDOW_POSITIONS, WINDOW_SLOTS } from '../../src/modules/window-manager/window.manager.js';
import mySuperComponent from './mySuperComponent.vue';

export default async function (app, config) {
  return {
    name: 'example',
    registerUiPlugin: async () => {
      console.log('registerUIPlugin', config);
      return {
        supportedMaps: ['vcs.vcm.maps.Openlayers', 'vcs.vcm.maps.Cesium'],
        name: 'example',
        mapButton: [
          {
            template: '<Button @click="switchWindow()">Example</Button>',
            setup() {
              const switchWindow = () => {
                app.windowManager.onRemoved.addEventListener((test) => {
                  console.log(test);
                });
                if (app.windowManager.has('test')) {
                  app.windowManager.remove('test');
                } else {
                  app.windowManager.add({
                    id: 'test',
                    component: mySuperComponent,
                    windowSlot: WINDOW_SLOTS.dynamicRight,
                  });
                }
              };
              return {
                switchWindow,
              };
            },
          },
          {
            template: '<Button @click="switchWindow()">ADD</Button>',
            setup() {
              const switchWindow = () => {
                if (app.windowManager.has(228)) {
                  app.windowManager.remove('test');
                } else {
                  app.windowManager.add({
                    id: 'test',
                    component: mySuperComponent,
                    windowSlot: WINDOW_SLOTS.dynamicRight,
                  });
                }
              };
              return {
                switchWindow,
              };
            },
          },
        ],
      };
    },
    postInitialize: async () => {
      console.log('postInitialize', config);
    },
    preInitialize: async () => {
      console.log('preInitialize', config);
    },
    postUiInitialize: async () => {
      app.windowManager.add({
        id: 228,
        component: mySuperComponent,
        width: 250,
        position: WINDOW_POSITIONS.topRight,
        windowSlot: WINDOW_SLOTS.dynamicRight,
      });

      app.toolboxManager.addToolboxGroup(
        {
          type: 'toggleButton',
          icon: '$vcsPointSelect',
          id: 15,
          active: true,
        },
        15,
      );
      const button = app.toolboxManager.get(15);

      console.log(button);
      console.log('postUiInitialize', config);
    },
  };
}
