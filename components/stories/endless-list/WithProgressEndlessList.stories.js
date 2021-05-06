import EndlessList from '@vcsuite/uicomponents/EndlessList.vue';

import { vuetify } from '@/plugins/vuetify';

import getProps from '../util/get-props';

export default {
  title: 'EndlessList/With Progress',
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


export const WithProgress = Template.bind({});
WithProgress.args = {
  items: Array(1000).fill('').map((k, i) => ({
    name: i,
    iconAppend: '$vcsExternalLink',
  })),
  itemsTotal: 2000,
  itemsLoaded: 1000,
  itemsDisplayed: 5,
  hasSearchbar: false,
  width: 320,
};
