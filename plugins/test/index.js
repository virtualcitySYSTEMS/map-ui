import { inject } from '@vue/composition-api';
import { Cartesian2 } from '@vcmap/cesium';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { toolboxData } from './toolbox-data';
import editor from './editor.vue';
import { windowSlot } from '../../src/modules/window-manager/windowManager.js';
import windowManagerExample from './windowManagerExample.vue';

let source;

function getSource() {
  if (!source) {
    source = new VectorSource();
  }
  return source;
}


export default async function (app) {
  return {
    name: 'test',
    registerUiPlugin: async () => ({
      mapButton: [
        {
          template: "<Button @click=\"alert('check')\">VC Systems</Button>",
          setup() {
            const cartesian3 = new Cartesian2(1, 2);
            const toolboxManager = inject('toolboxManager');

            toolboxData.forEach(([group, id]) => toolboxManager.addToolboxGroup(group, id));

            return {
              cartesian3,
              alert() {
                getSource().addFeature(new Feature({}));
                window.alert(`
there are ${getSource().getFeatures().length} features
          ${app.maps.activeMap.name}`);
              },
            };
          },
        },
        {
          template: "<Button @click='toggle'>Editor</Button>",
          setup() {
            const windowManager = inject('windowManager');

            return {
              toggle() {
                const id = 'config-editor';
                /** @type {WindowManager} */
                if (windowManager.has(id)) {
                  windowManager.remove(id);
                } else {
                  windowManager.add({
                    id,
                    state: {
                      headerTitle: 'Context Editor',
                    },
                    component: editor,
                    slot: windowSlot.STATIC,
                  });
                }
              },
            };
          },
        },
        {
          template: "<Button @click='toggle'>Windows</Button>",
          setup() {
            /** @type {WindowManager} */
            const windowManager = inject('windowManager');

            return {
              toggle() {
                const id = 'windowManagerExample';
                if (windowManager.has(id)) {
                  windowManager.remove(id);
                } else {
                  windowManager.add({
                    id,
                    state: {
                      headerTitle: 'windowManager Example',
                    },
                    component: windowManagerExample,
                    position: {
                      left: '60%',
                      right: '10%',
                      top: '10%',
                    },
                  });
                }
              },
            };
          },
        },
      ],
    }),
  };
}
