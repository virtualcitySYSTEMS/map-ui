import ConfirmationDialog from '@vcsuite/uicomponents/ConfirmationDialog.vue';

import { vuetify } from '@/plugins/vuetify.js';

export default {
  title: 'Dialog/Confirmation',
  component: ConfirmationDialog,
  argTypes: {
  },
};

const Template = (args, { argTypes }) => {
  return {
    vuetify,
    components: { ConfirmationDialog },
    props: Object.keys(argTypes),
    template: `
      <div>
        <button @click="open = true">
          open
        </button>
        <ConfirmationDialog
          v-bind="$props"
          on-dialog-close="open = false"
        >
        </ConfirmationDialog>
      </div>
    `,
    methods: {
      close() {
      },
    },
  };
};


export const Confirmation = Template.bind({});
Confirmation.args = {
  title: 'Privacy Policy 123',
  body: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore
        et dolore magna aliqua. Ut enim ad minim veniam`,
  primaryText: 'Confirm',
  secondaryText: 'Cancel',
  open: false,
};
