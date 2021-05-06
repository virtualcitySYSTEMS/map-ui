import EndlessList from '@vcsuite/uicomponents/EndlessList.vue';

import { vuetify } from '@/plugins/vuetify';

import getProps from '../util/get-props';

export default {
  title: 'EndlessList/Regular',
  component: EndlessList,
  argTypes: {
    items: {
      table: {
        disable: true,
      },
    },
  },
};

const Template = (args, { argTypes }) => {
  return {
    vuetify,
    components: { EndlessList },
    props: getProps(argTypes, { excludeKeys: ['items', 'load-more'] }),
    template: '<EndlessList v-bind="$props"/>',
  };
};


export const Regular = Template.bind({});
Regular.args = {
  items: Array(1000).fill('').map((k, i) => ({
    name: i,
    iconAppend: '$vcsExternalLink',
  })),
  itemsTotal: 2000,
  itemsLoaded: 1000,
  hasProgress: false,
  hasSearchbar: false,
  width: 320,
  itemsDisplayed: 5,
};
