import {
  ArcStyle,
  from3Dto2DLayout,
  PrimitiveOptionsType,
  alreadyTransformedToMercator,
} from '@vcmap/core';
import { Feature } from 'ol';
import {
  Circle,
  GeometryCollection,
  LineString,
  MultiLineString,
  MultiPoint,
  MultiPolygon,
  Point,
  Polygon,
} from 'ol/geom';
import { Stroke, Style, Text as OLText } from 'ol/style';

function layoutHelper(feature, layout = 'XYZ') {
  if (layout !== 'XYZ') {
    from3Dto2DLayout(feature.getGeometry());
  }
}

export function getPrimitiveFeature(layout) {
  const feature = new Feature({
    geometry: new Point([
      13.36218118875039, 52.515822422115036, 33.38730595560257,
    ]),
    isDefault: true,
    olcs_primitiveOptions: {
      type: PrimitiveOptionsType.CYLINDER,
      geometryOptions: {
        length: 80,
        topRadius: 20,
        bottomRadius: 40,
      },
      depthFailColor: 'rgba(0, 0, 255, 0.2)',
      offset: [0, 0, 40],
    },
  });
  feature.setId('Primitive');
  layoutHelper(feature, layout);
  return feature;
}

export function getModelFeature(layout) {
  const feature = new Feature({
    geometry: new Point([
      13.363859221598505, 52.515967046541505, 32.59208264613772,
    ]),
    isDefault: true,
    olcs_modelUrl: '/exampleData/CesiumMan.gltf',
    olcs_modelScaleX: 20,
    olcs_modelScaleY: 20,
    olcs_modelScaleZ: 40,
  });
  feature.setId('Model');
  layoutHelper(feature, layout);
  return feature;
}

export function getLabelFeature(layout) {
  const feature = new Feature({
    geometry: new Point([
      1488435.7314223575, 6894028.960149737, 33.5208502571338,
    ]),
    isDefault: true,
  });
  feature.setStyle(
    new Style({
      text: new OLText({
        text: 'Label',
      }),
      stroke: new Stroke({
        color: '#FF00FF',
        width: 2,
      }),
    }),
  );
  feature.setId('Label');
  feature.getGeometry()[alreadyTransformedToMercator] = true;

  layoutHelper(feature, layout);
  return feature;
}

export function getArrowFeature(layout) {
  const feature = new Feature({
    geometry: new LineString([
      [13.366858637514758, 52.51621074844718, 32.72847998624475],
      [13.368622504013356, 52.51631428269934, 33.23048941465071],
    ]),
    isDefault: true,
  });
  feature.setStyle(new ArcStyle());
  feature.setId('Arrow');
  layoutHelper(feature, layout);
  return feature;
}

export function getCircleFeature(layout) {
  const feature = new Feature({
    geometry: new Circle(
      [13.360899224141466, 52.51506455406184, 34.09269200786326],
      0.001,
    ),
    isDefault: true,
  });
  feature.setId('Circle');
  layoutHelper(feature, layout);
  return feature;
}

export function getPointFeature(layout) {
  const feature = new Feature({
    geometry: new Point([
      13.373567615611728, 52.51548029456612, 34.11213951937436,
    ]),
    isDefault: true,
  });
  feature.setId('Point');
  layoutHelper(feature, layout);
  return feature;
}

export function getPointsFeature(layout) {
  const feature = new Feature({
    geometry: new MultiPoint([
      [13.374358275687154, 52.513855119983305, 33.91001731696976],
      [13.37461329953504, 52.51415068687956, 34.032218848302364],
      [13.375878007044882, 52.51409378032608, 33.88938096529403],
    ]),
    isDefault: true,
  });
  feature.setId('Points');
  layoutHelper(feature, layout);
  return feature;
}

export function getLineStringFeature(layout) {
  const feature = new Feature({
    geometry: new LineString([
      [13.363844747632609, 52.515470473709854, 33.550534598980725],
      [13.366720318943523, 52.515665401253045, 33.76881006458447],
      [13.367412538305256, 52.51508187630654, 32.55462654508183],
    ]),
    isDefault: true,
  });
  feature.setId('LineString');
  layoutHelper(feature, layout);
  return feature;
}

export function getLineStringsFeature(layout) {
  const feature = new Feature({
    geometry: new MultiLineString([
      [
        [13.36352639114729, 52.513266460999546, 33.26824957279316],
        [13.363353059492573, 52.51410122358479, 33.16223998562612],
        [13.364131850580959, 52.51463043952424, 33.20317208734183],
      ],
      [
        [13.365850262457908, 52.51444203087061, 32.61805259641959],
        [13.36656566684233, 52.513951194203, 32.78073146380907],
        [13.36627639442513, 52.513405317141604, 32.528679428301025],
      ],
      [
        [13.366290652223967, 52.51284093005012, 33.293564901315726],
        [13.36528194828741, 52.512304426371344, 32.5181043954614],
        [13.363954256366572, 52.512483274042154, 33.1318583891006],
      ],
    ]),
    isDefault: true,
  });
  feature.setId('LineStrings');
  layoutHelper(feature, layout);
  return feature;
}

export function getPolygonFeature(layout) {
  const feature = new Feature({
    geometry: new Polygon([
      [
        [13.368703252048375, 52.51483723086997, 33.49978802690113],
        [13.372125570630947, 52.514467042453646, 34.17881387564488],
        [13.372623878945069, 52.515336736733786, 33.587916392132065],
        [13.36979246350535, 52.51572336567955, 34.14276491983953],
        [13.368703252048375, 52.51483723086997, 33.49978802690113],
      ],
    ]),
    isDefault: true,
  });
  feature.setId('Polygon');
  layoutHelper(feature, layout);
  return feature;
}

export function getPolygonsFeature(layout) {
  const feature = new Feature({
    geometry: new MultiPolygon([
      [
        [
          [13.368147753366285, 52.51388845623393, 33.326494025516986],
          [13.369439957644493, 52.513806731544804, 33.71837045675961],
          [13.369864824031266, 52.514204470721836, 33.90427477452053],
          [13.368652956316716, 52.51427909116808, 33.30150542013474],
          [13.368147753366285, 52.51388845623393, 33.326494025516986],
        ],
      ],
      [
        [
          [13.36908568340443, 52.513311470038445, 33.85600764188562],
          [13.370317227246808, 52.51266712675607, 33.942184554520324],
          [13.371726440088764, 52.513200118366456, 34.236263759862865],
          [13.371140661493031, 52.513403217334314, 33.836968802532446],
          [13.37025051092128, 52.51344597065966, 33.624748083503455],
          [13.369756747764669, 52.51346696101908, 33.71480053535501],
          [13.369289999321657, 52.51352152843859, 33.88720729210199],
          [13.369962684700711, 52.51365226834122, 33.50994865926776],
          [13.368960039632277, 52.51367751984219, 33.67689581665479],
          [13.36908568340443, 52.513311470038445, 33.85600764188562],
        ],
      ],
      [
        [
          [13.370951855771859, 52.514053649625225, 33.9281685013164],
          [13.371537851762398, 52.513614671407254, 34.450093341276464],
          [13.372435604984698, 52.513881261092365, 33.77611564016416],
          [13.372231219003348, 52.514139481519635, 34.244097450954634],
          [13.370951855771859, 52.514053649625225, 33.9281685013164],
        ],
      ],
    ]),
    isDefault: true,
  });
  feature.setId('Polygons');
  layoutHelper(feature, layout);
  return feature;
}

export function getGeometryCollectionFeature(layout) {
  const geometries = [
    getCircleFeature().getGeometry(),
    getPointFeature().getGeometry(),
    getLineStringFeature().getGeometry(),
    getPolygonFeature().getGeometry(),
  ];

  const geometry = new GeometryCollection(geometries);
  geometry.translate(0, -0.002);
  const feature = new Feature({
    geometry,
    isDefault: true,
  });
  feature.setId('GeometryCollection');
  layoutHelper(feature, layout);
  return feature;
}

export function getTiltedPolygonFeature(layout) {
  const feature = new Feature({
    geometry: new Polygon([
      [
        [13.368703252048375, 52.51483723086997, 33.49978802690113],
        [13.372125570630947, 52.514467042453646, 50.17881387564488],
        [13.372623878945069, 52.515336736733786, 120.58791639213206],
        [13.36979246350535, 52.51572336567955, 50.14276491983953],
        [13.368703252048375, 52.51483723086997, 33.49978802690113],
      ],
    ]),
    isDefault: true,
  });
  feature.getGeometry().translate(0.002, -0.002);
  feature.setId('TiltedPolygon');
  layoutHelper(feature, layout);
  return feature;
}

export function getTiltedLineStringFeature(layout) {
  const feature = new Feature({
    geometry: new LineString([
      [13.363844747632609, 52.515470473709854, 33.550534598980725],
      [13.366720318943523, 52.515665401253045, 50.76881006458447],
      [13.367412538305256, 52.51508187630654, 120.55462654508183],
    ]),
    isDefault: true,
  });
  feature.getGeometry().translate(0.002, -0.002);
  feature.setId('TiltedLineString');
  layoutHelper(feature, layout);
  return feature;
}
