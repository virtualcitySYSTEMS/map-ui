<script setup lang="ts">
  import { VSheet } from 'vuetify/components';
  import {
    computed,
    inject,
    onUnmounted,
    provide,
    reactive,
    ref,
    shallowRef,
    watch,
  } from 'vue';
  import type {
    EditFeaturesSession,
    VectorPropertiesOptions,
  } from '@vcmap/core';
  import {
    CesiumMap,
    GeometryType,
    is2DLayout,
    PanoramaMap,
    SessionType,
    TransformationMode,
    VectorProperties,
  } from '@vcmap/core';
  import { getLogger } from '@vcsuite/logger';
  import type Feature from 'ol/Feature.js';
  import type { VcsAction } from '@src/actions/actionHelper.js';
  import type VcsUiApp from '../../vcsUiApp.js';
  import VcsFeatureStyleComponent from '../style/VcsFeatureStyleComponent.ts.vue';
  import VcsFeatureTransforms from './VcsFeatureTransforms.ts.vue';
  import VcsVectorPropertiesComponent from './VcsVectorPropertiesComponent.ts.vue';
  import {
    genericVectorProperties,
    pointVectorProperties,
    nonPointVectorProperties,
  } from './vectorPropertiesHelper.js';
  import VcsFormSection from '../section/VcsFormSection.ts.vue';
  import VcsSnapTo from './VcsSnapTo.ts.vue';
  import VcsFeatureInputEditor from './VcsFeatureInputEditor.ts.vue';
  import {
    type EditorManager,
    editorTransformationIcons,
    getAllowedEditorTransformationModes,
  } from './vectorPropertiesHelper.js';

  /**
   * Returns a Set with all geometry types of the provided features
   * @param features Array of ol features
   * @returns Set with GeometryTypes
   */
  function getGeometryTypes(features: Feature[]): Set<GeometryType> {
    return new Set(
      features.map(
        (f) =>
          f.getGeometry()?.get('_vcsGeomType') ?? f.getGeometry()?.getType(),
      ),
    );
  }

  /**
   * @description A drawing window used for displaying selected features from editor sessions. A manager must be provided.
   * @vue-prop {Array<string>} [allowedVectorProperties=['altitudeMode', 'extrudedHeight', 'classificationType']] - The vector properties that should be displayed.
   * @vue-prop {boolean} [expandableVectorProperties=false] - Whether the vector properties should be expandable.
   * @vue-prop {boolean} [startOpenVectorProperties=false] - Whether the vector properties should be expended initially. Only used when expandableVectorProperties is true.
   * @vue-prop {boolean} [showResetVectorProperties=true] - Whether the reset button should be shown.
   * @vue-prop {boolean} [showStyle=true] - Whether the style component should be shown.
   */

  const props = withDefaults(
    defineProps<{
      allowedVectorProperties?: string[];
      altitudeModes?: string[];
      expandableVectorProperties?: boolean;
      startOpenVectorProperties?: boolean;
      showResetVectorProperties?: boolean;
      showStyle?: boolean;
      showSnapping?: boolean;
      showInputEditor?: boolean;
    }>(),
    {
      allowedVectorProperties: () => [
        'altitudeMode',
        'heightAboveGround',
        'extrudedHeight',
        'classificationType',
      ],
      altitudeModes: undefined,
      expandableVectorProperties: false,
      startOpenVectorProperties: false,
      showResetVectorProperties: true,
      showStyle: true,
      showSnapping: true,
      showInputEditor: false,
    },
  );

  const vcsApp = inject('vcsApp') as VcsUiApp;
  const editorManager = inject('manager') as EditorManager;
  const {
    currentFeatures: features,
    currentSession: session,
    currentEditSession: editSession,
    currentLayer: layer,
  } = editorManager;

  const localSnapTo = ref<('orthogonal' | 'parallel' | 'vertex' | 'edge')[]>(
    [],
  );
  watch(
    () => [session, editSession],
    () => {
      if (session.value?.type === SessionType.CREATE) {
        localSnapTo.value = session.value.snapTo;
      } else if (editSession.value?.type === SessionType.EDIT_GEOMETRY) {
        localSnapTo.value = editSession.value.snapTo;
      }
    },
    { immediate: true },
  );

  const snapTo = computed({
    get: () => (props.showSnapping ? localSnapTo.value : undefined),
    set(v) {
      if (v) {
        localSnapTo.value = v;
        if (session.value?.type === SessionType.CREATE) {
          session.value.snapTo = v;
        }

        if (editSession.value?.type === SessionType.EDIT_GEOMETRY) {
          editSession.value.snapTo = v;
        }
      }
    },
  });

  const availableModifyActions = shallowRef<VcsAction[]>([]);
  const availableVectorProperties = shallowRef<
    (keyof VectorPropertiesOptions)[]
  >([]);

  provide('features', features);
  const featureProperties = shallowRef<VectorPropertiesOptions | undefined>();

  watch(
    features,
    () => {
      featureProperties.value =
        layer.value?.vectorProperties.getValuesForFeatures(features.value);
    },
    { immediate: true },
  );

  /**
   * Sets the changed vector property options on the features. Also handles side effects.
   * @param update New property values from user input.
   */
  function updateFeatureProperties(update: VectorPropertiesOptions): void {
    layer.value?.vectorProperties.setValuesForFeatures(update, features.value);
    featureProperties.value =
      layer.value?.vectorProperties.getValuesForFeatures(features.value);
  }

  const is3D = ref(false);
  const is2DFeature = computed(() =>
    features.value.some((f) => {
      const geometry = f.getGeometry();
      if (geometry && geometry.getFlatCoordinates().length > 0) {
        return is2DLayout(geometry.getLayout());
      }
      return !is3D.value;
    }),
  );

  const defaultVectorProperties = reactive<VectorPropertiesOptions>(
    VectorProperties.getDefaultOptions(),
  );
  function activeMapHandler(): void {
    const isPanorama = vcsApp.maps.activeMap instanceof PanoramaMap;
    is3D.value = vcsApp.maps.activeMap instanceof CesiumMap || isPanorama;

    defaultVectorProperties.altitudeMode = isPanorama
      ? 'absolute'
      : 'clampToGround';
  }

  const mapActivatedListener =
    vcsApp.maps.mapActivated.addEventListener(activeMapHandler);
  activeMapHandler();

  const isGeometryEditing = computed(
    () => editSession.value?.type === SessionType.EDIT_GEOMETRY,
  );

  const currentTransformationMode = ref<TransformationMode | null>(null);
  let editModeListener = (): void => {};
  watch(
    editSession,
    () => {
      editModeListener();
      currentTransformationMode.value =
        (editSession.value as EditFeaturesSession)?.mode || null;
      if (currentTransformationMode.value) {
        editModeListener = (
          editSession.value as EditFeaturesSession
        ).modeChanged.addEventListener((mode) => {
          currentTransformationMode.value = mode;
        });
      }
    },
    { immediate: true },
  );

  function toggleTransformationSession(mode: TransformationMode): void {
    if (
      currentTransformationMode.value &&
      currentTransformationMode.value === mode
    ) {
      editorManager.stopEditing();
    } else {
      const p = editorManager.startTransformSession(mode);
      if (p instanceof Promise) {
        p.catch((e: unknown) => {
          getLogger('VcsFeatureEditingWindow').error(
            'Failed to start transformation session',
            e,
          );
        });
      }
    }
  }

  function toggleEditGeometrySession(): void {
    if (isGeometryEditing.value) {
      editorManager.stopEditing();
    } else {
      const p = editorManager.startEditSession();
      if (p instanceof Promise) {
        p.catch((e: unknown) => {
          getLogger('VcsFeatureEditingWindow').error(
            'Failed to start edit geometry session',
            e,
          );
        });
      }
    }
  }

  /**
   * @description Returns the current geometry types and the number of selected features.
   */
  const currentGeometryTypes = computed<{
    types: Set<GeometryType>;
    nFeatures: number;
  }>(() => ({
    types: getGeometryTypes(features.value),
    nFeatures: features.value.length,
  }));

  function getAllowedModifyActions(): {
    actions: VcsAction[];
    destroy: () => void;
  } {
    const allowedModes = getAllowedEditorTransformationModes(
      currentGeometryTypes.value.types,
      features.value,
      layer.value!,
      is3D.value,
    );

    const allowedActions: VcsAction[] = allowedModes.map((mode) => {
      return reactive({
        name: mode,
        title: `components.editor.${mode}`,
        icon: editorTransformationIcons[mode],
        active: mode === currentTransformationMode.value,
        callback: (): void => {
          toggleTransformationSession(mode);
        },
      });
    });

    const transformationModeWatcher = watch(
      currentTransformationMode,
      (mode) => {
        allowedActions.forEach((action) => {
          if (
            Object.values(TransformationMode).includes(
              action.name as TransformationMode,
            )
          ) {
            action.active = mode === (action.name as TransformationMode);
          }
        });
      },
    );

    let geometryEditingWatcher: (() => void) | undefined;
    if (features.value.length === 1) {
      const editGeometryAction = reactive({
        name: 'editGeometry',
        title: `components.editor.edit`,
        icon: '$vcsEditVertices',
        active: isGeometryEditing.value,
        callback: (): void => {
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
      destroy(): void {
        transformationModeWatcher();
        geometryEditingWatcher?.();
      },
    };
  }

  function getAllowedVectorProperties(): (keyof VectorPropertiesOptions)[] {
    const properties: (keyof VectorPropertiesOptions)[] =
      genericVectorProperties.filter((p) =>
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

  let destroyModifyActions: () => void = () => {};

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

  const showInputs = computed(
    () =>
      !currentTransformationMode.value &&
      props.showInputEditor &&
      features.value.length === 1 &&
      features.value[0]?.getGeometry()?.getType() === 'Point',
  );
</script>

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
          :feature-properties="featureProperties!"
          :allow-z-input="is3D"
        />
        <div v-else-if="showInputs" class="py-1">
          <VcsFeatureInputEditor
            :is3-d="is3D && featureProperties!.altitudeMode === 'absolute'"
          />
        </div>
        <div v-else class="py-1">
          {{ $st('components.editor.modifyInfo') }}
        </div>
      </div>
    </VcsFormSection>
    <VcsSnapTo v-if="snapTo" v-model="snapTo" />
    <VcsFormSection heading="components.editor.styleHeader" v-if="showStyle">
      <VcsFeatureStyleComponent :feature-properties="featureProperties!" />
    </VcsFormSection>
    <VcsVectorPropertiesComponent
      :show3-d-properties="is3D"
      :is2-d-feature="is2DFeature"
      :value-default="defaultVectorProperties"
      :properties="availableVectorProperties!"
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

<style scoped></style>
