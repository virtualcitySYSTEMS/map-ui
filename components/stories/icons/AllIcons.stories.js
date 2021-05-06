import { IconIds, IconNames } from '@vcsuite/uicomponents/icons/+all';

export default {
  title: 'Icons/All',
};

const Template = (args, { argTypes }) => {
  return {
    props: Object.keys(argTypes),
    template: `

    <table>
      <tr>
        <th class="text-left"> ID </th>
        <th class="text-left"> Name </th>
        <th class="text-left"> Icon </th>
      </tr>
      <tr v-for="(icon, index) of icons" :key="icon"> 
        <td>
          {{iconIds[index]}}
        </td>
        <td>
          {{icon}}
        </td>
        <td>        
          <v-icon v-text="icon"/>
        </td>
      </tr>
    </table>
    `,
    data: () => {
      return {
        icons: IconNames,
        iconIds: IconIds,
      };
    },
  };
};


export const All = Template.bind({});
All.args = {};
