import { obliqueCollectionCollection } from '@vcmap/core/src/vcs/vcm/globalCollections';
import OpenStreetMap from '@vcmap/core/src/vcs/vcm/layer/openStreetMap';
import Openlayers from '@vcmap/core/src/vcs/vcm/maps/openlayers';
import ObliqueCollection from '@vcmap/core/src/vcs/vcm/oblique/ObliqueCollection';
import ObliqueDataSet from '@vcmap/core/src/vcs/vcm/oblique/ObliqueDataSet';
import MapCollection from '@vcmap/core/src/vcs/vcm/util/mapCollection';
import Projection from '@vcmap/core/src/vcs/vcm/util/projection';
import CesiumMap from '@vcmap/core/src/vcs/vcm/maps/cesium';
import ObliqueMap from '@vcmap/core/src/vcs/vcm/maps/oblique';
import ViewPoint from '@vcmap/core/src/vcs/vcm/util/viewpoint';

window.CESIUM_BASE_URL = '/node_modules/@vcmap/cesium/Source/';

// eslint-disable-next-line import/prefer-default-export
export async function onMounted({ targetId }) {
  const ol = new Openlayers({
    name: 'openlayers',
  });
  const mapCollection = new MapCollection();
  const osm = new OpenStreetMap({});
  mapCollection.add(ol);
  mapCollection.setTarget(targetId);
  mapCollection.layerCollection.add(osm);
  await mapCollection.setActiveMap(ol.name);
  await ol.gotoViewPoint(new ViewPoint({
    name: 'Berlin',
    distance: 157.3489399067245,
    cameraPosition: [
      13.411394127432544,
      52.497745299212546,
      119.75750333776946,
    ],
    groundPosition: [
      13.411253398151665,
      52.498931077538636,
      34.57404938876193,
    ],
    heading: 355.85726724381027,
    pitch: -32.777305832704,
    roll: 359.98398234382154,
  }));
  await osm.activate();

  const projection = new Projection({
    epsg: 25833,
    proj4: '+proj=utm +zone=33 +ellps=GRS80 +units=m +no_defs',
  });

  const obliqueCollection = new ObliqueCollection({
    name: 'berlin',
    dataSets: [
      new ObliqueDataSet('https://a.3d.blc.shc.eu/WAB/base_layer/obliques/image.json', projection.proj),
    ],
  });
  obliqueCollectionCollection.add(obliqueCollection);
  const oblique = new ObliqueMap({
    name: 'oblique',
  });
  await oblique.setCollection(obliqueCollection);
  mapCollection.add(oblique);

  const cesium = new CesiumMap({
    name: 'cesium',
  });
  mapCollection.add(cesium);

  return mapCollection;
}

