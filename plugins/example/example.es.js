/* eslint-disable no-console */

import { WINDOW_POSITIONS, WINDOW_SLOTS } from '../../src/modules/window-manager/window.manager';
import mySuperComponent from './mySuperComponent.vue';
import { inject } from '@vue/composition-api';

export default {
  registerUiPlugin: async (config) => {
    console.log('registerUIPlugin', config);
    return {
      supportedMaps: ['vcs.vcm.maps.Openlayers', 'vcs.vcm.maps.Cesium'],
      name: 'example',
      mapButton: [{
        template: '<Button @click="switchWindow()">Example</Button>',
        setup() {
          const context = inject('context');
          return {
            context,
          };
        },
        methods: {
          switchWindow() {
            this.context.windowManager.onRemoved.addEventListener((test) => {
              console.log(test);
            });
            if (this.context.windowManager.has('test')) {
              this.context.windowManager.remove('test');
            } else {
              this.context.windowManager.add({
                id: 'test',
                component: mySuperComponent,
                windowSlot: WINDOW_SLOTS.dynamicRight,
              });
            }
          },
        },
      }, {
        template: '<Button @click="switchWindow()">ADD</Button>',
        setup() {
          const context = inject('context');
          return {
            context,
          };
        },
        methods: {
          switchWindow() {
            if (this.context.windowManager.has(228)) {
              this.context.windowManager.remove('test');
            } else {
              this.context.windowManager.add({
                id: 'test',
                component: mySuperComponent,
                windowSlot: WINDOW_SLOTS.dynamicRight,
              });
            }
          },
        },
      }],
    };
  },
  postInitialize: async (config) => {
    console.log('postInitialize', config);
  },
  preInitialize: async (config) => {
    console.log('preInitialize', config);
  },
  postUiInitialize: async (config, context) => {
    context.windowManager.add({
      id: 228,
      component: mySuperComponent,
      width: 250,
      position: WINDOW_POSITIONS.topRight,
      windowSlot: WINDOW_SLOTS.dynamicRight,
    });

    context.toolboxManager.addToolboxGroup(
      {
        type: 'toggleButton',
        icon: '$vcsPointSelect',
        id: 15,
        active: true,
      },
      15,
    );
    const button = context.toolboxManager.get(15);

    console.log(button);
    console.log('postUiInitialize', config);
  },
};
