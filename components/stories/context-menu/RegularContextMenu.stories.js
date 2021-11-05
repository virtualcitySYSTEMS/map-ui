import ContextMenu from '@vcsuite/uicomponents/ContextMenu.vue';

import { vuetify } from '@/plugins/vuetify.js';

import getProps from '../util/get-props.js';

export default {
  title: 'Context Menu/Regular',
  component: ContextMenu,
  argTypes: {
    clickEvent: {
      table: {
        disable: true,
      },
    },
  },
};

const Template = (args, { argTypes }) => {
  return {
    vuetify,
    components: { ContextMenu },
    props: getProps(argTypes, { excludeKeys: ['items', 'load-more'] }),
    template: `
    <div>
      <h2> Right-click somewhere to open context-menu</h2>

      <ContextMenu
        v-if="clickEvent"
        :click-event="clickEvent"
        v-bind="$props"
        @menu-closed="clickEvent = undefined"
      />
    </div>
    `,
    mounted() {
      const self = this;
      document.body.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        self.clickEvent = event;
      });
    },
  };
};


export const Regular = Template.bind({});
Regular.args = {
  clickEvent: undefined,
  width: 220,
};
