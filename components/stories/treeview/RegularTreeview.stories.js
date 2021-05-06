import Treeview from '@vcsuite/uicomponents/Treeview.vue';

export default {
  title: 'Treeview/Regular',
  component: Treeview,
  argTypes: {
    hasSearchbar: {
      table: {
        category: 'VCS-Treeview',
      },
    },
    topLevelSelectable: {
      table: {
        category: 'VCS-Treeview',
      },
    },
    activatable: {
      table: {
        category: 'V-Treeview',
      },
    },
    selectable: {
      table: {
        category: 'V-Treeview',
      },
    },
    items: {
      table: {
        category: 'VCS-Treeview',
      },
    },
  },
};

const Template = (args, { argTypes }) => {
  return {
    props: Object.keys(argTypes),
    components: { Treeview },
    template: `
        <Treeview 
          :has-searchbar="hasSearchbar" 
          :activatable="activatable" 
          :selectable="selectable" 
          :top-level-selectable="topLevelSelectable" 
          :items="items"
        />
    `,
  };
};


export const Regular = Template.bind({});
Regular.args = {
  activatable: true,
  hasSearchbar: false,
  selectable: true,
  topLevelSelectable: false,
  items: [
    {
      id: 1,
      name: 'Vector Layer',
      actions: [
        { title: 'color', icon: '$vcsColorSwatch' },
        { title: 'location', icon: 'mdi-crosshairs-gps' },
      ],
      menuItems: [
        { title: 'Rename', icon: 'mdi-pencil' },
        { title: 'Show on Map', icon: '$vcsMap' },
      ],
      children: [
        { id: 2, name: 'Calendar app' },
        { id: 3, name: 'Chrome : app' },
        { id: 4, name: 'Webstorm : app' },
      ],
    },
    {
      id: 5,
      name: 'Measurements',
      hasUpdate: true,
      children: [
        { id: 7, name: 'Calendar app' },
        { id: 8, name: 'Chrome : app' },
        { id: 9, name: 'Webstorm : app' },
      ],
    },
    {
      id: 10,
      name: 'Texts',
      children: [
        {
          id: 11,
          name: 'Textgruppe A',
          actions: [{ title: 'location', icon: 'mdi-crosshairs-gps' }],
          children: [
            { id: 12, name: 'Standard Ebene' },
            { id: 13, name: 'Text Ebene 002' },
          ],
        },
      ],
    },
    {
      id: 15,
      name: 'Camera flights',
      disabled: true,
      children: [
        {
          id: 16,
          name: 'Camera Flight 1 in one line',
          actions: [
            { title: 'play', icon: 'mdi-play' },
            { title: 'edit', icon: 'mdi-pencil' },
          ],
          playable: true,
          editable: true,
        },
        {
          id: 17,
          name: 'Camera Flight 2 in one line',
          actions: [
            { title: 'play', icon: 'mdi-play' },
            { title: 'edit', icon: 'mdi-pencil' },
          ],
          playable: true,
          editable: true,
        },
      ],
    },
    {
      id: 19,
      name: 'Imported Objects',
      children: [
        {
          id: 20,
          name: 'Tutorials',
          children: [
            { id: 21, name: 'Basic layouts : mp4' },
            { id: 22, name: 'Advanced techniques : mp4' },
            { id: 23, name: 'All about app : dir' },
          ],
        },
        { id: 24, name: 'Intro : mov' },
        { id: 25, name: 'Conference introduction : avi' },
      ],
    },
  ],
};
