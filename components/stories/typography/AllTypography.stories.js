
import { vuetify } from '@/plugins/vuetify.js';

import getProps from '../util/get-props.js';

export default {
  title: 'Typography/All',
  argTypes: {
  },
};


const Template = (args, { argTypes }) => {
  return {
    vuetify,
    props: getProps(argTypes, { excludeKeys: ['input', 'default'] }),
    template: `
      <div>
        <h1> H1 Headline </h1>
        <h2> H2 Headline </h2>
        <h3> H3 Headline </h3>
        <h4> H4 Headline </h4>
      </div>
      `,
  };
};

export const All = Template.bind({});
All.args = {

};
