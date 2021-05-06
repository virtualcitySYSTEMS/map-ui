import TextField from '@vcsuite/uicomponents/TextField.vue';

import getProps from '../util/get-props';


export default {
  title: 'Text Field/Meter',
  component: TextField,
  argTypes: {
  },
};


const Template = (args, { argTypes }) => {
  return {
    props: getProps(argTypes, { excludeKeys: [] }),
    components: { TextField },
    template: `
      <div style="max-width: 220px">
        <TextField 
          v-bind="$props" 
          v-model="value" 
          hide-details
        >
        </TextField>
      </div>
      `,
  };
};


export const Meter = Template.bind({});
Meter.args = {
  value: 12,
  label: 'Meter',
  dense: true,
  unit: 'm',
  type: 'number',
};
