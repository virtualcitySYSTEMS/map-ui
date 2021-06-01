// TODO missing WSV & Cluster
import {
  Buildings,
  CesiumTileset,
  Czml,
  DataSource,
  FeatureLayer,
  FeatureStore,
  GeoJSON,
  Layer,
  OpenStreetMap,
  PointCloud,
  RasterLayer,
  SingleImage,
  Terrain,
  TMS,
  Vector,
  VectorTile,
  WFS,
  WMS,
  WMTS,
  VcsClassRegistry,
} from '@vcmap/core';

VcsClassRegistry.registerClass(Buildings.className, Buildings);
VcsClassRegistry.registerClass(CesiumTileset.className, CesiumTileset);
VcsClassRegistry.registerClass(Czml.className, Czml);
VcsClassRegistry.registerClass(DataSource.className, DataSource);
VcsClassRegistry.registerClass(FeatureLayer.className, FeatureLayer);
VcsClassRegistry.registerClass(FeatureStore.className, FeatureStore);
VcsClassRegistry.registerClass(GeoJSON.className, GeoJSON);
VcsClassRegistry.registerClass(Layer.className, Layer);
VcsClassRegistry.registerClass(OpenStreetMap.className, OpenStreetMap);
VcsClassRegistry.registerClass(PointCloud.className, PointCloud);
VcsClassRegistry.registerClass(RasterLayer.className, RasterLayer);
VcsClassRegistry.registerClass(SingleImage.className, SingleImage);
VcsClassRegistry.registerClass(Terrain.className, Terrain);
VcsClassRegistry.registerClass(TMS.className, TMS);
VcsClassRegistry.registerClass(Vector.className, Vector);
VcsClassRegistry.registerClass(VectorTile.className, VectorTile);
VcsClassRegistry.registerClass(WFS.className, WFS);
VcsClassRegistry.registerClass(WMS.className, WMS);
VcsClassRegistry.registerClass(WMTS.className, WMTS);
