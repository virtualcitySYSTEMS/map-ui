import Badge from '@vcsuite/uicomponents/Badge.vue';
import Button from '@vcsuite/uicomponents/Button.vue';

import { elevationControl, iconControl } from '../util/controls';
import getProps from '../util/get-props';


export default {
  title: 'Button/Standard',
  component: Button,
  argTypes: {
    icon: {
      control: iconControl,
    },
    elevation: {
      control: elevationControl,
    },
  },
};


const Template = (args, { argTypes }) => {
  return {
    props: getProps(argTypes, { excludeKeys: ['input', 'default'] }),
    components: { Button, Badge },
    template: `
      <Button 
        v-bind="$props" 
        v-model="value" 
        @input="value = $event"
        :has-update="hasUpdate"
      >
      </Button>
      `,
  };
};


export const Standard = Template.bind({});
Standard.args = {
  icon: '$vcsCircle',
  value: false,
  toggleable: true,
};
Standard.parameters = {
  controls: {
    include: [
      'icon',
      'value',
      'toggleable',
      'elevation',
      'input',
      'default'],
  },
};
