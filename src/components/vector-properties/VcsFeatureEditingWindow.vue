<template>
  <v-sheet>
    <VcsFormSection
      v-if="session.type === SessionType.SELECT"
      heading="components.editor.modifyHeader"
      :action-button-list-overflow-count="5"
      :header-actions="availableModifyActions"
    >
      <div class="px-1">
        <VcsFeatureTransforms
          v-if="currentTransformationMode"
          :transformation-mode="currentTransformationMode"
          :feature-properties="featureProperties"
          :allow-z-input="is3D"
        />
        <div v-else class="px-1 py-1">
          {{ $t('components.editor.modifyInfo') }}
        </div>
      </div>
    </VcsFormSection>
    <VcsFormSection heading="components.editor.styleHeader" v-if="showStyle">
      <VcsFeatureStyleComponent :feature-properties="featureProperties" />
    </VcsFormSection>
    <VcsVectorPropertiesComponent
      :value="featureProperties"
      :show3-d-properties="is3D"
      @propertyChange="updateFeatureProperties"
      :value-default="defaultVectorProperties"
      :properties="availableVectorProperties"
      :show-dividers="false"
      :expandable="expandableVectorProperties"
      :start-open="startOpenVectorProperties"
      :show-reset="showResetVectorProperties"
    />
  </v-sheet>
</template>

<script>
  import { VSheet } from 'vuetify/lib';
  import { inject, ref, watch, onUnmounted, provide, computed } from 'vue';
  import {
    CesiumMap,
    GeometryType,
    SessionType,
    TransformationMode,
    VectorProperties,
  } from '@vcmap/core';
  import VcsFeatureStyleComponent from '../style/VcsFeatureStyleComponent.vue';
  import VcsFeatureTransforms from './VcsFeatureTransforms.vue';
  import VcsVectorPropertiesComponent, {
    genericVectorProperties,
    pointVectorProperties,
    nonPointVectorProperties,
  } from './VcsVectorPropertiesComponent.vue';
  import VcsFormSection from '../form-inputs-controls/VcsFormSection.vue';

  /**
   * @typedef {Object} EditorManager
   * @property {import("vue").ShallowRef<import("@vcmap/core").Layer|undefined>} currentLayer
   * @property {import("vue").ShallowRef<import("ol").Feature[]>} currentFeatures
   * @property {import("vue").ShallowRef<import("@vcmap/core").EditGeometrySession | import("@vcmap/core").EditFeaturesSession | undefined>} currentEditSession
   * @property {import("vue").ShallowRef<import("@vcmap/core").SelectFeaturesSession | import("@vcmap/core").CreateFeatureSession<import("@vcmap/core").GeometryType> | undefined>} currentSession
   * @property {function():Promise<void>} placeCurrentFeaturesOnTerrain
   * @property {function():void} stopEditing
   * @property {function(import("ol").Feature=):Promise<void>|void} startEditSession
   * @property {function(import("@vcmap/core").TransformationMode, import("ol").Feature[]=):Promise<void>|void} startTransformSession
   */

  export const EditorTransformationIcons = {
    [TransformationMode.TRANSLATE]: 'mdi-axis-arrow',
    [TransformationMode.ROTATE]: 'mdi-rotate-3d-variant',
    [TransformationMode.SCALE]: 'mdi-arrow-top-right-bottom-left',
    [TransformationMode.EXTRUDE]: '$vcsWall',
  };

  /**
   * Returns a Set with all geometry types of the provided features
   * @param {import("ol").Feature[]} features Array of ol features
   * @returns {Set<GeometryType>} Set with GeometryTypes
   */
  function getGeometryTypes(features) {
    return new Set(
      features.map(
        (f) =>
          f.getGeometry()?.get('_vcsGeomType') ?? f.getGeometry()?.getType(),
      ),
    );
  }

  /**
   * Returns the allowed transformation modes for the provided geometry types and number of features. Rotate is e.g. not allowed for a single point but for multiple points.
   * @param {Set<GeometryType>} geometryTypes A set with all geometry types of the features.
   * @param {number} nFeatures The number of the features.
   * @returns {Array<TransformationMode>} The allowed transformation modes.
   */
  export function getAllowedEditorTransformationModes(
    geometryTypes,
    nFeatures,
  ) {
    const isSinglePoint =
      nFeatures === 1 && geometryTypes.has(GeometryType.Point);
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

  /**
   * @description A drawing window used for displaying selected features from editor sessions. A manger must be provided.
   * @vue-prop {Array<string>} [allowedVectorProperties=['altitudeMode', 'extrudedHeight', 'classificationType']] - The vector properties that should be displayed.
   * @vue-prop {boolean} [expandableVectorProperties=false] - Whether the vector properties should be expandable.
   * @vue-prop {boolean} [startOpenVectorProperties=false] - Whether the vector properties should be expended initially. Only used when expandableVectorProperties is true.
   * @vue-prop {boolean} [showResetVectorProperties=true] - Whether the reset button should be shown.
   * @vue-prop {boolean} [showStyle=true] - Whether the style component should be shown.
   */
  export default {
    components: {
      VcsFeatureTransforms,
      VSheet,
      VcsFormSection,
      VcsVectorPropertiesComponent,
      VcsFeatureStyleComponent,
    },
    name: 'VcsFeatureEditingWindow',
    props: {
      allowedVectorProperties: {
        type: Array,
        default: () => [
          'altitudeMode',
          'heightAboveGround',
          'extrudedHeight',
          'classificationType',
        ],
      },
      expandableVectorProperties: {
        type: Boolean,
        default: false,
      },
      startOpenVectorProperties: {
        type: Boolean,
        default: false,
      },
      showResetVectorProperties: {
        type: Boolean,
        default: true,
      },
      showStyle: {
        type: Boolean,
        default: true,
      },
    },
    setup(props) {
      const vcsApp = inject('vcsApp');
      /** @type {EditorManager} */
      const editorManager = inject('manager');
      const {
        currentFeatures: features,
        currentSession: session,
        currentEditSession: editSession,
        currentLayer: layer,
      } = editorManager;

      const availableModifyActions = ref([]);
      const availableVectorProperties = ref([]);

      provide('features', features);
      const featureProperties = ref();

      watch(
        features,
        () => {
          featureProperties.value =
            layer.value.vectorProperties.getValuesForFeatures(features.value);
        },
        { immediate: true },
      );

      /**
       * Sets the changed vector property options on the features. Also handles side effects.
       * @param {import("@vcmap/core").VectorPropertiesOptions} update New property values from user input.
       */
      async function updateFeatureProperties(update) {
        const extrusionLikePropertyKeys = [
          'extrudedHeight',
          'skirt',
          'storeysAboveGround',
          'storeysBelowGround',
          'storeyHeightsAboveGround',
          'storeyHeightsBelowGround',
        ];
        const setsExtrusionLikePropertyKeys =
          !!extrusionLikePropertyKeys.filter(
            (key) => Object.keys(update).includes(key) && !!update[key],
          ).length;
        if (
          setsExtrusionLikePropertyKeys &&
          featureProperties.value.altitudeMode !== 'absolute'
        ) {
          update.altitudeMode = 'absolute';
        } else if (update.altitudeMode === 'clampToGround') {
          extrusionLikePropertyKeys
            .filter((key) => !!featureProperties.value[key])
            .forEach((key) => {
              update[key] = 0;
            });
        }
        // when in create mode and changing altitude mode, this is triggered, but currentFeatures is empty array.
        if (update.altitudeMode === 'absolute' && features?.length) {
          await editorManager.placeCurrentFeaturesOnTerrain();
        }

        layer.value.vectorProperties.setValuesForFeatures(
          update,
          features.value,
        );
        featureProperties.value =
          layer.value.vectorProperties.getValuesForFeatures(features.value);
      }

      const currentTransformationMode = ref();
      const is3D = ref(false);

      function updateIs3D() {
        is3D.value = vcsApp.maps.activeMap instanceof CesiumMap;
      }
      const mapActivatedListener =
        vcsApp.maps.mapActivated.addEventListener(updateIs3D);
      updateIs3D();

      const isGeometryEditing = computed(
        () => editSession.value?.type === SessionType.EDIT_GEOMETRY,
      );

      let editModeListener = () => {};
      watch(editSession, () => {
        editModeListener();
        currentTransformationMode.value = editSession.value?.mode || null;
        if (currentTransformationMode.value) {
          editModeListener = editSession.value.modeChanged.addEventListener(
            (mode) => {
              currentTransformationMode.value = mode;
            },
          );
        }
      });

      function toggleTransformationSession(mode) {
        if (
          currentTransformationMode.value &&
          currentTransformationMode.value === mode
        ) {
          editorManager.stopEditing();
        } else {
          editorManager.startTransformSession(mode);
        }
      }

      function toggleEditGeometrySession() {
        if (isGeometryEditing.value) {
          editorManager.stopEditing();
        } else {
          editorManager.startEditSession();
        }
      }

      /**
       * @description Returns the current geometry types and the number of selected features.
       * @type {import("vue").ComputedRef<{ types: Set<GeometryType>, nFeatures: number }>}
       */
      const currentGeometryTypes = computed(() => ({
        types: getGeometryTypes(features.value),
        nFeatures: features.value.length,
      }));

      function getAllowedModifyActions() {
        const allowedModes = getAllowedEditorTransformationModes(
          currentGeometryTypes.value.types,
          currentGeometryTypes.value.nFeatures,
        );

        const allowedActions = allowedModes.map((mode) => {
          return {
            name: mode,
            title: `components.editor.${mode}`,
            icon: EditorTransformationIcons[mode],
            active: computed(() => currentTransformationMode.value === mode),
            callback: () => {
              toggleTransformationSession(mode);
            },
          };
        });

        if (features.value.length === 1) {
          allowedActions.unshift({
            name: 'editGeometry',
            title: `components.editor.edit`,
            icon: '$vcsEditVertices',
            active: isGeometryEditing,
            callback: () => {
              toggleEditGeometrySession();
            },
          });
        }

        return allowedActions;
      }

      function getAllowedVectorProperties() {
        const properties = genericVectorProperties.filter((p) =>
          props.allowedVectorProperties.includes(p),
        );
        const geomTypes = currentGeometryTypes.value.types;

        const hasPoint = geomTypes.has(GeometryType.Point);
        if (!hasPoint) {
          nonPointVectorProperties.forEach((p) => {
            if (props.allowedVectorProperties.includes(p)) {
              properties.push(p);
            }
          });
          properties.push('classificationType');
        }

        if (hasPoint && geomTypes.size === 1) {
          pointVectorProperties.forEach((p) => {
            if (props.allowedVectorProperties.includes(p)) {
              properties.push(p);
            }
          });
        }

        return properties;
      }

      const geometryTypesWatcher = watch(
        currentGeometryTypes,
        (curr, prev) => {
          if (
            curr.types.size !== prev?.types.size ||
            ![...curr.types].every((value) => prev?.types.has(value)) ||
            (curr.nFeatures > 1 && prev.nFeatures === 1) ||
            (prev.nFeatures > 1 && curr.nFeatures === 1)
          ) {
            availableModifyActions.value = getAllowedModifyActions();
            availableVectorProperties.value = getAllowedVectorProperties();
          }
        },
        { immediate: true },
      );

      const propsWatcher = watch(
        () => props.allowedVectorProperties,
        () => {
          availableVectorProperties.value = getAllowedVectorProperties();
        },
      );

      onUnmounted(() => {
        mapActivatedListener();
        editModeListener();
        geometryTypesWatcher();
        propsWatcher();
        editorManager.stopEditing();
      });

      return {
        featureProperties,
        session,
        SessionType,
        currentTransformationMode,
        TransformationMode,
        availableModifyActions,
        availableVectorProperties,
        is3D,
        updateFeatureProperties,
        defaultVectorProperties: VectorProperties.getDefaultOptions(),
      };
    },
  };
</script>

<style scoped></style>
