import { getCurrentInstance, inject } from '@vue/composition-api';
import {Cartesian2} from '@vcmap/cesium';

export default {
  registerUiPlugin: async () => ({
    mapButton: {
      template: '<Button @click="alert(\'check\')">VC Systems</Button>',
      setup() {
        console.log(getCurrentInstance());
        const context = inject('context');
        const cartesian3 = new Cartesian2(1,2);
        console.log(cartesian3);
        return {
          context,
          cartesian3
        };
      },
      methods: {
        alert(msg) {
          window.alert(this.context.maps.activeMap.name);
        },
      },
    },
  }),
};
