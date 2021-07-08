import { getCurrentInstance, inject } from '@vue/composition-api';

export default {
  registerUiPlugin: async () => ({
    mapButton: {
      template: '<Button @click="alert(\'check\')">VC Systems</Button>',
      setup() {
        console.log(getCurrentInstance());
        const context = inject('context');

        return {
          context,
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
