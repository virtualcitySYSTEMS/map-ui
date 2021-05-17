import { obliqueCollectionCollection } from '@vcmap/core/src/vcs/vcm/globalCollections';
import OpenStreetMap from '@vcmap/core/src/vcs/vcm/layer/openStreetMap';
import Openlayers from '@vcmap/core/src/vcs/vcm/maps/openlayers';
import ObliqueCollection from '@vcmap/core/src/vcs/vcm/oblique/ObliqueCollection';
import ObliqueDataSet from '@vcmap/core/src/vcs/vcm/oblique/ObliqueDataSet';
import MapCollection from '@vcmap/core/src/vcs/vcm/util/mapCollection';
import Projection from '@vcmap/core/src/vcs/vcm/util/projection';
import CesiumMap from '@vcmap/core/src/vcs/vcm/maps/cesium';
import ObliqueMap from '@vcmap/core/src/vcs/vcm/maps/oblique';


window.CESIUM_BASE_URL = '/node_modules/@vcmap/cesium/Source/';

// eslint-disable-next-line import/prefer-default-export
export async function onMounted({ targetId }) {
  const openlayers = new Openlayers({
    name: 'openlayers',
  });
  const mapCollection = new MapCollection();
  const osm = new OpenStreetMap({});
  mapCollection.add(openlayers);
  mapCollection.setTarget(targetId);
  mapCollection.layerCollection.add(osm);
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

  return { mapCollection, openlayers };
}

