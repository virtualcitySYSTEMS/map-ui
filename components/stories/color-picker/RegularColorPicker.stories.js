import ColorPicker from '../../ColorPicker.vue';

import getProps from '../util/get-props';

export default {
  title: 'Color Picker/Regular',
  component: ColorPicker,
  argTypes: {
    mode: {
      control: {
        type: 'select',
        options: [
          'rgba',
          'hsla',
          'hexa',
        ],
      },
    },
    dotSize: {
      control: {
        type: 'range',
        min: 0,
        max: 100,
        step: 1,
      },
    },
    value: {
      control: {
        type: 'color',
      },
    },
  },
};

const Template = (args, { argTypes }) => {
  return {
    components: { ColorPicker },
    props: getProps(argTypes),
    template: `
      <ColorPicker 
        v-bind="$props"
      />
    `,
  };
};


export const Regular = Template.bind({});
Regular.args = {
  dotSize: 12,
};
