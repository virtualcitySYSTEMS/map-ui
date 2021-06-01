// TODO missing VcsMap export
import {
  BaseOLMap,
  CesiumMap,
  Oblique,
  Openlayers,
  VcsClassRegistry,
} from '@vcmap/core';

VcsClassRegistry.registerClass(BaseOLMap.className, BaseOLMap);
VcsClassRegistry.registerClass(CesiumMap.className, CesiumMap);
VcsClassRegistry.registerClass(Oblique.className, Oblique);
VcsClassRegistry.registerClass(Openlayers.className, Openlayers);
