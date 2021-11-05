import Compass from '@vcsuite/uicomponents/Compass.vue';

import { rotationControlOblique } from '../util/controls.js';
import getProps from '../util/get-props.js';

export default {
  title: 'Compass/Oblique',
  component: Compass,
  argTypes: {
    viewMode: {
      table: {
        disable: true,
      },
    },
    value: {
      control: rotationControlOblique,
    },
  },
};

const Template = (args, { argTypes }) => {
  return {
    components: { Compass },
    props: getProps(argTypes),
    template: `
      <Compass
        :view-mode="viewMode"
        v-model="value"
      />
    `,
  };
};


export const Oblique = Template.bind({});
Oblique.args = {
  viewMode: 'oblique',
  value: 0,
};
