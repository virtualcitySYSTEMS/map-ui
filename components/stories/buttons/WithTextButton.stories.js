import Badge from '@vcsuite/uicomponents/Badge.vue';
import Button from '@vcsuite/uicomponents/Button.vue';

import { elevationControl, iconControl } from '../util/controls';
import getProps from '../util/get-props';

export default {
  title: 'Button/With Text',
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
        {{ text }}
      </Button>
      `,
  };
};

export const WithText = Template.bind({});
WithText.args = {
  icon: '$vcsCircle',
  value: true,
  toggleable: true,
  hasUpdate: false,
  text: 'Hello World!',
};
WithText.parameters = {
  controls: {
    include: [
      'icon',
      'value',
      'toggleable',
      'elevation',
      'hasUpdate',
      'text',
      'input',
      'default',
    ],
  },
};
