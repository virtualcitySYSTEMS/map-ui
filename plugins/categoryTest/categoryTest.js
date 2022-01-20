import { inject } from '@vue/composition-api';
import VcsButton from '@vcsuite/uicomponents/Button.vue';
import { windowSlot } from '../../src/modules/window-manager/windowManager.js';
import Categories from './Categories.vue';

export default async function categoryTest() {
  return {
    name: 'categoryTest',
    registerUiPlugin() {
      return {
        mapButton: [
          {
            template: '<VcsButton @input="toggle" icon="$vcsPen" />',
            components: {
              VcsButton,
            },
            setup() {
              const windowManager = inject('windowManager');

              return {
                toggle() {
                  const id = 'category-editor';
                  /** @type {WindowManager} */
                  if (windowManager.has(id)) {
                    windowManager.remove(id);
                  } else {
                    windowManager.add({
                      id,
                      component: Categories,
                      slot: windowSlot.DETACHED,
                      position: {
                        width: 500,
                      },
                    });
                  }
                },
              };
            },
          },
        ],
      };
    },
  };
}
