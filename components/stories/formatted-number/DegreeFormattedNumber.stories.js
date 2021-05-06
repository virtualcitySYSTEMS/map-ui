import FormattedNumber from '@vcsuite/uicomponents/FormattedNumber.vue';

import { formattedNumberUnitControl } from '../util/controls';
import getProps from '../util/get-props';


export default {
  title: 'Formatted Number/Degree',
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


export const Degree = Template.bind({});
Degree.args = {
  value: 42,
  unit: 'deg',
  fractionDigits: 0,
};

