import TextField from '@vcsuite/uicomponents/TextField.vue';

import getProps from '../util/get-props';


export default {
  title: 'Text Field/Degree',
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


export const Degree = Template.bind({});
Degree.args = {
  value: 12,
  label: 'Degree',
  dense: true,
  unit: 'deg',
  type: 'number',
};
