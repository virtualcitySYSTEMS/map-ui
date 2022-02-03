import { VcsFormSection } from '@vcsuite/ui-components';
import InputColumnCoordinates from '@vcsuite/uicomponents/InputColumnCoordinates.vue';
import InputColumnDimensions from '@vcsuite/uicomponents/InputColumnDimensions.vue';

import getProps from '../util/get-props.js';

export default {
  title: 'Form Section/Regular',
  component: VcsFormSection,
  argTypes: {
    title: {
      control: {
        type: 'text',
      },
    },
  },
};


const Template = (args, { argTypes }) => {
  return {
    props: getProps(argTypes, { excludeKeys: ['default'] }),
    components: {
      VcsFormSection,
      InputColumnDimensions,
      InputColumnCoordinates,
    },
    template: `
    <div style="max-width: 320px">
      <VcsFormSection
        v-bind="$props"
      >
        <div class="d-flex flex-row px-2 pb-3">
          <InputColumnDimensions class="mr-10" />
          <InputColumnCoordinates />
        </div>
      </VcsFormSection>
    </div>
      `,
  };
};

export const Regular = Template.bind({});
Regular.args = {
  title: 'Parameter',
  titleActions: [
    { name: 'help', icon: 'mdi-help-circle' },
    { name: 'settings', icon: 'mdi-cog' },
  ],
};
