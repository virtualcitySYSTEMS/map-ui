import FormattedNumber from '@vcsuite/uicomponents/FormattedNumber.vue';

import { formattedNumberUnitControl } from '../util/controls';
import getProps from '../util/get-props';


export default {
  title: 'Formatted Number/Cubic Meter',
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


export const CubicMeter = Template.bind({});
CubicMeter.args = {
  value: 123456.123123,
  unit: 'cm',
  fractionDigits: 4,
};

