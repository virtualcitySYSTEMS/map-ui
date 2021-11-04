import { getCurrentInstance, inject } from '@vue/composition-api';
import {Cartesian2} from '@vcmap/cesium';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';

let source;

function getSource() {
  if (!source) {
    source = new VectorSource();
  }
  return source;
}


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
          cartesian3,
        };
      },
      methods: {
        alert(msg) {
          getSource().addFeature(new Feature({}));
          window.alert(`
there are ${getSource().getFeatures().length} features
          ${this.context.maps.activeMap.name}`);
        },
      },
    },
  }),
};
