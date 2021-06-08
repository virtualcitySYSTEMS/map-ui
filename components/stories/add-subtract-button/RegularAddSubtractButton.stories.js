import AddSubtractButtons from '@vcsuite/uicomponents/AddSubtractButtons.vue';

import getProps from '../util/get-props';


export default {
  title: 'Add&Subtract Button/Regular',
  component: AddSubtractButtons,
  argTypes: {
  },
};


const Template = (args, { argTypes }) => {
  return {
    props: getProps(argTypes, { excludeKeys: ['input', 'default'] }),
    components: { AddSubtractButtons },
    template: `
      <div>

        <AddSubtractButtons 
          v-bind="$props" 
          v-model="value" 
          @input="value = $event"
        >
        </AddSubtractButtons>

        {{value}}
      </div>
      `,
  };
};


export const Regular = Template.bind({});
Regular.args = {
  value: 0,
};
Regular.parameters = {
  controls: {
    include: [
      'value',
      'elevation',
    ],
  },
};
