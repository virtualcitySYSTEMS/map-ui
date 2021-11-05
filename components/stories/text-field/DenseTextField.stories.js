import TextField from '@vcsuite/uicomponents/TextField.vue';

import getProps from '../util/get-props.js';


export default {
  title: 'Text Field/Dense',
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


export const Dense = Template.bind({});
Dense.args = {
  value: 'Hello World',
  label: 'Text Field',
  dense: true,
};
