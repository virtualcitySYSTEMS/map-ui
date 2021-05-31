import Treeview from '@vcsuite/uicomponents/Treeview.vue';
import { v4 as uuid } from 'uuid';

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
          :name-key="'title'"
        />
    `,
  };
};

const mockData = [
  {
    id: uuid(),
    type: 'vcs.vcm.widgets.legend.ClusterItem',
    title: {
      en: 'Base Maps',
      de: 'Grundkarten',
      pl: 'Mapy podkładowe',
    },
    children: [
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.LayerItem',
        layerName: 'Bäume',
        title: {
          en: 'Trees',
          de: 'Bäume',
          pl: 'Drzew',
        },
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.LayerItem',
        layerName: 'terrain_v3.4',
        infoUrl: '',
        title: {
          en: 'Terrain',
          de: 'Gelände',
          pl: 'Teren',
        },
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.LayerItem',
        layerName: 'Openstreetmap OSM Cache',
        title: {
          en: 'OpenStreetMap',
          de: 'OpenStreetMap',
          pl: 'OpenStreetMap',
        },
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.LayerItem',
        layerName: 'fisbroker-dop-2015',
        title: {
          en: 'Aerial Image (2015)',
          de: 'Luftbild (2015)',
          pl: 'Ortofotomapa (2015)',
        },
      },
    ],
  },
  {
    id: uuid(),
    type: 'vcs.vcm.widgets.legend.ClusterItem',
    title: {
      en: '3d Building model',
      de: '3D-Gebäude',
      pl: 'Budynki 3D',
    },
    children: [
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.LayerItem',
        layerName: 'buildings',
        title: {
          en: 'textured Buildings',
          de: 'Texturierte Gebäude',
          pl: 'budynki z teksturą',
        },
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.LayerItem',
        layerName: 'buildings_untextured',
        availableStyles: [
          'MeasuredHeightGreen',
          'MeasuredHeightBrown',
          'MeasuredHeightBlue',
          'ClassifiedbyRoofType',
          'BuildingFunction',
          'Transparentbuildings',
        ],
        infoUrl: '',
        title: {
          en: 'untextured Buildings',
          de: 'Untexturierte Gebäude',
          pl: 'budynki bez tekstury',
        },
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.LayerItem',
        layerName: 'mesh_surface',
        infoUrl: '',
        availableStyles: [],
        title: '3D-Mesh',
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.LayerItem',
        layerName: 'osmBuildingFootprints',
        infoUrl: '',
        availableStyles: [
          'Transparent',
          'osmBuildingFootprintStyle',
        ],
        title: 'buildings footprints (openstreetmap)',
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.CzmlAnimationItem',
        layerName: 'czmlDynamicCesiumMan',
        title: {
          en: 'Test Dynamic CZML Man',
          de: 'Test Dynamic CZML Man',
        },
        showPlayer: true,
      },
    ],
  },
  {
    id: uuid(),
    type: 'vcs.vcm.widgets.legend.ClusterItem',
    title: {
      en: 'solar potential analysis',
      de: 'Solarpotenzialanalyse',
      pl: 'Analiza potencjału energii słonecznej',
    },
    children: [
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.GroupItem',
        clickable: false,
        startOpen: false,
        title: {
          en: 'solar irradiation per year',
          de: 'Einstrahlung pro Jahr',
          pl: 'promieniowanie słoneczne rocznie',
        },
        children: [
          {
            id: uuid(),
            type: 'vcs.vcm.widgets.legend.LayerItem',
            layerName: 'lod_solar_year_shading',
            viewpointName: 'pp_solar',
            infoUrl: '',
            title: {
              en: 'Solar radiation per year with shading',
              de: 'Solare Einstrahlung pro Jahr mit Verschattung',
              pl: 'Promieniowanie słoneczne rocznie z cieniowaniem',
            },
          },
          {
            id: uuid(),
            type: 'vcs.vcm.widgets.legend.LayerItem',
            layerName: 'citygml_trees_solar',
            title: {
              en: 'Vegetation (shading objects)',
              de: 'Bäume (Verschattungsobjekte)',
              pl: 'Drzewa (cieniowanie obiektów)',
            },
          },
          {
            id: uuid(),
            type: 'vcs.vcm.widgets.legend.LayerItem',
            layerName: 'lod2_solar_year',
            title: {
              en: 'Solar radiation per year without shading',
              de: 'Solare Einstrahlung pro Jahr ohne Verschattung',
              pl: 'Promieniowanie słoneczne rocznie bez cieniowania',
            },
          },
        ],
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.GroupItem',
        clickable: false,
        startOpen: false,
        title: {
          en: 'monthly solar irradiation',
          de: 'Einstrahlung ausgewählter Monate',
          pl: 'miesięczne napromieniowanie słoneczne',
        },
        children: [
          {
            id: uuid(),
            type: 'vcs.vcm.widgets.legend.LayerItem',
            layerName: 'lod2_solar_jan',
            title: {
              en: 'Solar irradiation January',
              de: 'Solare Einstrahlung Januar',
              pl: 'Promieniowanie słoneczne styczeń',
            },
          },
          {
            id: uuid(),
            type: 'vcs.vcm.widgets.legend.LayerItem',
            layerName: 'lod2_solar_apr',
            title: {
              en: 'Solar irradiation April',
              de: 'Solare Einstrahlung April',
              pl: 'Promieniowanie słoneczne kwiecień',
            },
          },
          {
            id: uuid(),
            type: 'vcs.vcm.widgets.legend.LayerItem',
            layerName: 'lod2_solar_jul',
            title: {
              en: 'Solar irradiation July',
              de: 'Solare Einstrahlung Juli',
              pl: 'Promieniowanie słoneczne lipiec',
            },
          },
        ],
      },
    ],
  },
  {
    id: uuid(),
    type: 'vcs.vcm.widgets.legend.ClusterItem',
    title: '3D-Objekte',
  },
  {
    id: uuid(),
    type: 'vcs.vcm.widgets.legend.ClusterItem',
    title: {
      en: 'Point Cloud',
      de: 'Punktwolke',
      pl: 'Chmury punktów',
    },
    children: [
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.LayerItem',
        layerName: 'pointcloud',
        viewpointName: 'pointcloud',
        title: {
          en: 'Tiergarten',
          de: 'Tiergarten',
          pl: 'Obszar TierGarten',
        },
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.LayerItem',
        layerName: 'PointCloud Changedetection',
        viewpointName: 'changedetection',
        availableStyles: [
          'CIR',
          'Tree-ID',
          'Distance',
          'Classification',
        ],
        title: {
          en: 'Berlin Buch',
          de: 'Berlin Buch',
        },
      },
    ],
  },
  {
    id: uuid(),
    type: 'vcs.vcm.widgets.legend.ClusterItem',
    title: {
      en: 'Viewpoints',
      de: 'Ansichten',
    },
    children: [
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.ViewpointItem',
        viewpointName: 'berlin',
        title: {
          en: 'Berlin',
          de: 'Berlin',
        },
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.ViewpointItem',
        viewpointName: 'brandenburger_tor',
        title: {
          en: 'Brandenburg Gate',
          de: 'Brandenburger Tor',
        },
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.ViewpointItem',
        viewpointName: 'alexanderplatz',
        title: {
          en: 'Alexanderplatz',
          de: 'Alexanderplatz',
        },
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.ViewpointItem',
        viewpointName: 'potsdamer_platz',
        title: {
          en: 'Potsdamer Platz',
          de: 'Potsdamer Platz',
        },
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.ViewpointItem',
        viewpointName: 'kaiser_wilhelm_gedächtniskirche',
        title: {
          en: 'Kaiser Wilhelm Memorial Church',
          de: 'Kaiser-Wilhelm-Gedächtniskirche',
        },
      },
      {
        id: uuid(),
        type: 'vcs.vcm.widgets.legend.ViewpointItem',
        viewpointName: 'oberbaumbrücke',
        title: {
          en: 'Oberbaum Bridge',
          de: 'Oberbaumbrücke',
        },
      },
    ],
  },
];

export const Regular = Template.bind({});
Regular.args = {
  activatable: true,
  hasSearchbar: false,
  selectable: true,
  topLevelSelectable: true,
  items: mockData,
  // items: [
  //   {
  //     id: 1,
  //     title: 'Vector Layer',
  //     actions: [
  //       { title: 'color', icon: '$vcsColorSwatch' },
  //       { title: 'location', icon: 'mdi-crosshairs-gps' },
  //     ],
  //     menuItems: [
  //       { title: 'Rename', icon: 'mdi-pencil' },
  //       { title: 'Show on Map', icon: '$vcsMap' },
  //     ],
  //     children: [
  //       { id: 2, title: 'Calendar app' },
  //       { id: 3, title: 'Chrome : app' },
  //       { id: 4, title: 'Webstorm : app' },
  //     ],
  //   },
  //   {
  //     id: 5,
  //     title: 'Measurements',
  //     hasUpdate: true,
  //     children: [
  //       { id: 7, title: 'Calendar app' },
  //       { id: 8, title: 'Chrome : app' },
  //       { id: 9, title: 'Webstorm : app' },
  //     ],
  //   },
  //   {
  //     id: 10,
  //     title: 'Texts',
  //     children: [
  //       {
  //         id: 11,
  //         title: 'Textgruppe A',
  //         actions: [{ title: 'location', icon: 'mdi-crosshairs-gps' }],
  //         children: [
  //           { id: 12, title: 'Standard Ebene' },
  //           { id: 13, title: 'Text Ebene 002' },
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     id: 15,
  //     title: 'Camera flights',
  //     disabled: true,
  //     children: [
  //       {
  //         id: 16,
  //         title: 'Camera Flight 1 in one line',
  //         actions: [
  //           { title: 'play', icon: 'mdi-play' },
  //           { title: 'edit', icon: 'mdi-pencil' },
  //         ],
  //         playable: true,
  //         editable: true,
  //       },
  //       {
  //         id: 17,
  //         title: 'Camera Flight 2 in one line',
  //         actions: [
  //           { title: 'play', icon: 'mdi-play' },
  //           { title: 'edit', icon: 'mdi-pencil' },
  //         ],
  //         playable: true,
  //         editable: true,
  //       },
  //     ],
  //   },
  //   {
  //     id: 19,
  //     title: 'Imported Objects',
  //     children: [
  //       {
  //         id: 20,
  //         title: 'Tutorials',
  //         children: [
  //           { id: 21, title: 'Basic layouts : mp4' },
  //           { id: 22, title: 'Advanced techniques : mp4' },
  //           { id: 23, title: 'All about app : dir' },
  //         ],
  //       },
  //       { id: 24, title: 'Intro : mov' },
  //       { id: 25, title: 'Conference introduction : avi' },
  //     ],
  //   },
  // ],
};
