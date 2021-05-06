import InputColumnCoordinates from '@vcsuite/uicomponents/InputColumnCoordinates.vue';
import InputColumnDimensions from '@vcsuite/uicomponents/InputColumnDimensions.vue';
import MediaControls from '@vcsuite/uicomponents/MediaControls.vue';

import getProps from '../util/get-props';

export default {
  title: 'Media Controls/Regular',
  component: MediaControls,
  argTypes: {
    value: {
      control: {
        type: 'range',
        min: 0,
        max: 100,
        step: 1,
      },
    },
    max: {
      table: {
        disable: true,
      },
    },
    min: {
      table: {
        disable: true,
      },
    },
  },
};


const Template = (args, { argTypes }) => {
  return {
    props: getProps(argTypes, { excludeKeys: ['default'] }),
    components: { MediaControls, InputColumnDimensions, InputColumnCoordinates },
    template: '<MediaControls v-bind="$props" />',
  };
};

export const Regular = Template.bind({});
Regular.args = {

};
