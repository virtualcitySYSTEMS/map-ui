import type { ShallowRef } from 'vue';
import {
  type CreateFeatureSession,
  type EditFeaturesSession,
  type EditGeometrySession,
  GeometryType,
  type SelectFeaturesSession,
  TransformationMode,
  type VectorLayer,
} from '@vcmap/core';
import type Feature from 'ol/Feature.js';

export type EditorManager = {
  currentLayer: ShallowRef<VectorLayer | undefined>;
  currentFeatures: ShallowRef<Feature[]>;
  currentEditSession: ShallowRef<
    EditGeometrySession | EditFeaturesSession | undefined
  >;
  currentSession: ShallowRef<
    SelectFeaturesSession | CreateFeatureSession<GeometryType> | undefined
  >;
  stopEditing: () => void;
  startEditSession: (feature?: Feature) => Promise<void> | void;
  startTransformSession: (
    mode: TransformationMode,
    features?: Feature[],
  ) => Promise<void> | void;
};

export const editorTransformationIcons = {
  [TransformationMode.TRANSLATE]: 'mdi-axis-arrow',
  [TransformationMode.ROTATE]: 'mdi-rotate-3d-variant',
  [TransformationMode.SCALE]: 'mdi-arrow-top-right-bottom-left',
  [TransformationMode.EXTRUDE]: '$vcsWall',
};

export const genericVectorProperties = [
  'altitudeMode',
  'allowPicking',
  'groundLevel',
  'heightAboveGround',
  'skirt',
  'extrudedHeight',
] as const;

export const pointVectorProperties = [
  'eyeOffset',
  'scaleByDistance',
  'modelUrl',
  'modelScaleX',
  'modelScaleY',
  'modelScaleZ',
  'modelHeading',
  'modelPitch',
  'modelRoll',
  'modelAutoScale',
  'baseUrl',
] as const;

export const nonPointVectorProperties = [
  'classificationType',
  'storeysAboveGround',
  'storeysBelowGround',
  'storeyHeightsAboveGround',
  'storeyHeightsBelowGround',
] as const;

export const vectorProperties = [
  ...genericVectorProperties,
  ...nonPointVectorProperties,
  ...pointVectorProperties,
] as const;

/**
 * Returns the allowed transformation modes for the provided geometry types and number of features. Rotate is e.g. not allowed for a single point but for multiple points.
 * @param geometryTypes A set with all geometry types of the features.
 * @param features The features currently being edited.
 * @param layer The vector layer containing the features.
 * @param is3D if the current map is 3D
 * @returns The allowed transformation modes.
 */
export function getAllowedEditorTransformationModes(
  geometryTypes: Set<GeometryType>,
  features: Feature[],
  layer: VectorLayer,
  is3D = false,
): TransformationMode[] {
  const nFeatures = features.length;
  const isSinglePoint =
    nFeatures === 1 &&
    geometryTypes.has(GeometryType.Point) &&
    (!is3D || layer.vectorProperties.renderAs(features[0]) === 'geometry');

  const isSingleCircle =
    nFeatures === 1 && geometryTypes.has(GeometryType.Circle);

  const isBboxSelected = geometryTypes.has(GeometryType.BBox);

  return [
    TransformationMode.TRANSLATE,
    ...(isSinglePoint || isSingleCircle || isBboxSelected
      ? []
      : [TransformationMode.ROTATE]),
    ...(isSinglePoint || isSingleCircle ? [] : [TransformationMode.SCALE]),
  ];
}
