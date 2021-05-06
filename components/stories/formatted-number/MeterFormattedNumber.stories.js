import FormattedNumber from '@vcsuite/uicomponents/FormattedNumber.vue';

import { formattedNumberUnitControl } from '../util/controls';
import getProps from '../util/get-props';


export default {
  title: 'Formatted Number/Meter',
  component: FormattedNumber,
  argTypes: {
    unit: {
      control: formattedNumberUnitControl,
    },
  },
};


const Template = (args, { argTypes }) => {
  return {
    props: getProps(argTypes, { excludeKeys: [] }),
    components: { FormattedNumber },
    template: `
      <FormattedNumber 
        v-bind="$props" 
        v-model="value" 
      >
      </FormattedNumber>
      `,
  };
};


export const Meter = Template.bind({});
Meter.args = {
  value: 11.333,
  unit: 'm',
  fractionDigits: 2,
};

