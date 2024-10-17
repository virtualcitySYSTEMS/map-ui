<template>
  <v-sheet class="vcs-feature-editing-window">
    <VcsFormSection
      v-if="session?.type === SessionType.SELECT"
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
      :show3-d-properties="is3D"
      :is2-d-feature="is2DFeature"
      :value-default="defaultVectorProperties"
      :properties="availableVectorProperties"
      :show-dividers="false"
      :expandable="expandableVectorProperties"
      :start-open="startOpenVectorProperties"
      :show-reset="showResetVectorProperties"
      :model-value="featureProperties"
      :altitude-modes="altitudeModes"
      @update:model-value="updateFeatureProperties"
    />
  </v-sheet>
</template>

<script>
  import { VSheet } from 'vuetify/components';
  import {
    inject,
    ref,
    watch,
    onUnmounted,
    provide,
    computed,
    shallowRef,
    reactive,
  } from 'vue';
  import {
    CesiumMap,
    GeometryType,
    is2DLayout,
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
  import VcsFormSection from '../section/VcsFormSection.vue';

  /**
   * @typedef {Object} EditorManager
   * @property {import("vue").ShallowRef<import("@vcmap/core").Layer|undefined>} currentLayer
   * @property {import("vue").ShallowRef<import("ol").Feature[]>} currentFeatures
   * @property {import("vue").ShallowRef<import("@vcmap/core").EditGeometrySession | import("@vcmap/core").EditFeaturesSession | undefined>} currentEditSession
   * @property {import("vue").ShallowRef<import("@vcmap/core").SelectFeaturesSession | import("@vcmap/core").CreateFeatureSession<import("@vcmap/core").GeometryType> | undefined>} currentSession
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
   * @param {import("ol").Feature[]} features The features currently being edited.
   * @param {import("@vcmap/core").VectorLayer} layer The number of the features.
   * @param {boolean} is3D if the current map is 3D
   * @returns {Array<TransformationMode>} The allowed transformation modes.
   */
  export function getAllowedEditorTransformationModes(
    geometryTypes,
    features,
    layer,
    is3D = false,
  ) {
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
      altitudeModes: {
        type: Array,
        default: undefined,
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

      const availableModifyActions = shallowRef([]);
      const availableVectorProperties = shallowRef([]);

      provide('features', features);
      const featureProperties = shallowRef();

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
      function updateFeatureProperties(update) {
        layer.value.vectorProperties.setValuesForFeatures(
          update,
          features.value,
        );
        featureProperties.value =
          layer.value.vectorProperties.getValuesForFeatures(features.value);
      }

      const is3D = ref(false);
      const is2DFeature = computed(() =>
        features.value.some((f) => {
          const geometry = f.getGeometry();
          if (geometry && geometry.getFlatCoordinates().length > 0) {
            return is2DLayout(f.getGeometry()?.getLayout());
          }
          return !is3D.value;
        }),
      );

      function updateIs3D() {
        is3D.value = vcsApp.maps.activeMap instanceof CesiumMap;
      }
      const mapActivatedListener =
        vcsApp.maps.mapActivated.addEventListener(updateIs3D);
      updateIs3D();

      const isGeometryEditing = computed(
        () => editSession.value?.type === SessionType.EDIT_GEOMETRY,
      );

      const currentTransformationMode = ref();
      let editModeListener = () => {};
      watch(
        editSession,
        () => {
          editModeListener();
          currentTransformationMode.value = editSession.value?.mode || null;
          if (currentTransformationMode.value) {
            editModeListener = editSession.value.modeChanged.addEventListener(
              (mode) => {
                currentTransformationMode.value = mode;
              },
            );
          }
        },
        { immediate: true },
      );

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

      /**
       * @returns {{actions: VcsActions, destroy: function():void}}
       */
      function getAllowedModifyActions() {
        const allowedModes = getAllowedEditorTransformationModes(
          currentGeometryTypes.value.types,
          features.value,
          layer.value,
          is3D.value,
        );

        const allowedActions = allowedModes.map((mode) => {
          return reactive({
            name: mode,
            title: `components.editor.${mode}`,
            icon: EditorTransformationIcons[mode],
            active: mode === currentTransformationMode.value,
            callback: () => {
              toggleTransformationSession(mode);
            },
          });
        });

        const transformationModeWatcher = watch(
          currentTransformationMode,
          (mode) => {
            allowedActions.forEach((action) => {
              if (Object.values(TransformationMode).includes(action.name)) {
                action.active = mode === action.name;
              }
            });
          },
        );

        let geometryEditingWatcher;
        if (features.value.length === 1) {
          const editGeometryAction = reactive({
            name: 'editGeometry',
            title: `components.editor.edit`,
            icon: '$vcsEditVertices',
            active: isGeometryEditing.value,
            callback: () => {
              toggleEditGeometrySession();
            },
          });
          allowedActions.unshift(editGeometryAction);

          geometryEditingWatcher = watch(isGeometryEditing, () => {
            editGeometryAction.active = isGeometryEditing.value;
          });
        }

        return {
          actions: allowedActions,
          destroy() {
            transformationModeWatcher();
            geometryEditingWatcher?.();
          },
        };
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

      let destroyModifyActions = () => {};

      const geometryTypesWatcher = watch(
        currentGeometryTypes,
        (curr, prev) => {
          if (
            curr.types.size !== prev?.types.size ||
            ![...curr.types].every((value) => prev?.types.has(value)) ||
            (curr.nFeatures > 1 && prev.nFeatures === 1) ||
            (prev.nFeatures > 1 && curr.nFeatures === 1)
          ) {
            destroyModifyActions();
            const modifyActions = getAllowedModifyActions();
            destroyModifyActions = modifyActions.destroy;

            availableModifyActions.value = modifyActions.actions;
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
        destroyModifyActions();
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
        is2DFeature,
        updateFeatureProperties,
        defaultVectorProperties: VectorProperties.getDefaultOptions(),
      };
    },
  };
</script>

<style scoped></style>
