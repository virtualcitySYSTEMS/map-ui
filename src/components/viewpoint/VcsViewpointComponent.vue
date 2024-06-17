<template>
  <v-sheet>
    <VcsFormSection
      heading="components.viewpoint.general"
      :expandable="expandable"
      start-open
      v-if="!(hideGeneral || (hideName && hideTitle && hideAnimate))"
    >
      <v-container class="py-0 px-1">
        <v-row no-gutters v-if="!hideName">
          <v-col cols="6">
            <VcsLabel html-for="name" dense required>
              {{ $t('components.viewpoint.name') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              id="name"
              dense
              clearable
              v-model="name"
              :rules="nameRules"
            />
          </v-col>
        </v-row>
        <v-row no-gutters v-if="!hideTitle">
          <v-col cols="6">
            <VcsLabel html-for="title" dense>
              {{ $t('components.viewpoint.title') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              id="title"
              dense
              clearable
              :placeholder="$t('components.viewpoint.titlePlaceholder')"
              v-model="title"
            />
          </v-col>
        </v-row>
        <v-row no-gutters v-if="!hideAnimate">
          <v-col cols="6">
            <VcsCheckbox
              id="animate"
              label="components.viewpoint.animate"
              dense
              v-model="animate"
            />
          </v-col>
          <v-col>
            <VcsTextField
              v-if="animate"
              id="duration"
              clearable
              :hide-spin-buttons="true"
              type="number"
              :min="1"
              unit="s"
              :title="$t('components.viewpoint.duration')"
              v-model.number="duration"
            />
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>
    <VcsFormSection
      heading="components.viewpoint.positionAndOrientation"
      :expandable="expandable"
      start-open
      :header-actions="[updateFromViewAction, editAction]"
    >
      <v-container class="py-0 px-1">
        <template v-if="!isCesiumMap">
          <v-row no-gutters>
            <v-col cols="6">
              <VcsLabel html-for="groundPosition" dense>
                {{ $t('components.viewpoint.groundPosition') }}
              </VcsLabel>
            </v-col>
          </v-row>
          <VcsCoordinate
            v-model="groundPosition"
            :disabled="editAction.active"
            @blur="handleInput('groundPosition')"
            @update:model-value="handleInput('groundPosition')"
            hide-z
          />
        </template>
        <template v-else>
          <v-row no-gutters>
            <v-col cols="6">
              <VcsLabel html-for="cameraPosition" dense>
                {{ $t('components.viewpoint.cameraPosition') }}
              </VcsLabel>
            </v-col>
          </v-row>
          <VcsCoordinate
            v-model="cameraPosition"
            :disabled="editAction.active"
            @blur="handleInput('cameraPosition')"
            @update:model-value="handleInput('cameraPosition')"
          />
        </template>
        <template v-if="!isCesiumMap">
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="distance" dense>
                {{ $t('components.viewpoint.distance') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                :min="0"
                :step="100"
                prefix="d"
                unit="m"
                :decimals="2"
                :hide-spin-buttons="true"
                type="number"
                v-model.number="distance"
                :disabled="editAction.active"
                @blur="gotoViewpoint"
                @update:model-value="gotoViewpoint"
                :rules="[isPositiveNumber]"
              />
            </v-col>
          </v-row>
        </template>
        <template v-if="isCesiumMap">
          <div v-for="key in ['heading', 'pitch', 'roll']" :key="key">
            <v-row no-gutters>
              <v-col cols="9">
                <VcsLabel :html-for="key" dense>
                  {{ $st(`components.viewpoint.${key}`) }}
                </VcsLabel>
              </v-col>
              <v-col cols="3">
                <VcsTextField
                  :id="key"
                  :hide-spin-buttons="true"
                  type="number"
                  unit="°"
                  v-model.number="hpr[key].value"
                  :disabled="editAction.active"
                  @blur="gotoViewpoint"
                  @update:model-value="gotoViewpoint"
                  :rules="[isFiniteNumber]"
                  class="pr-0 ml-6"
                />
              </v-col>
            </v-row>
            <v-row no-gutters>
              <v-col cols="12">
                <VcsSlider
                  dense
                  height="32"
                  hide-details
                  :step="0.1"
                  v-model="hpr[key].value"
                  v-bind="hprSliderOptions[key]"
                  :disabled="editAction.active"
                  @update:model-value="gotoViewpoint"
                />
              </v-col>
            </v-row>
          </div>
        </template>
      </v-container>
    </VcsFormSection>
  </v-sheet>
</template>

<script>
  import {
    computed,
    inject,
    onMounted,
    onUnmounted,
    reactive,
    ref,
    watch,
  } from 'vue';
  import { VSheet, VContainer, VRow, VCol } from 'vuetify/components';
  import { CesiumMap, ObliqueMap, OpenlayersMap, Viewpoint } from '@vcmap/core';
  import VcsFormSection from '../form-inputs-controls/VcsFormSection.vue';
  import VcsLabel from '../form-inputs-controls/VcsLabel.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import VcsCheckbox from '../form-inputs-controls/VcsCheckbox.vue';
  import VcsCoordinate from '../form-inputs-controls/VcsCoordinate.vue';
  import VcsSlider from '../form-inputs-controls/VcsSlider.vue';
  import { usePrimitiveProperty } from '../vector-properties/composables.js';

  /**
   * @param {import("vue").emit} emit
   * @param {import("@vcmap/core").Viewpoint} viewpoint
   * @param {() => import("@vcmap/core").ViewpointOptions} getModelValue
   */
  function emitInput(emit, viewpoint, getModelValue) {
    const clone = structuredClone(getModelValue());
    const { name, animate, duration, ...options } = viewpoint.toJSON();
    emit('update:modelValue', Object.assign(clone, options));
  }

  /**
   * Set up post render handler, if action is active.
   * If action is inactive, destroy post render handler to allow manual editing.
   * @param {import("@vcmap/ui").VcsUiApp} app
   * @param {import("vue").emit} emit
   * @param {() => import("@vcmap/core").ViewpointOptions} getModelValue
   * @param {import("vue").Ref<boolean>} isCesiumMap
   * @param {boolean} startSync - whether to set up post render handler on creation
   * @returns {{action: import("../../actions/actionHelper.js").VcsAction, destroy: function():void}}
   */
  function createEditingAction(
    app,
    emit,
    getModelValue,
    isCesiumMap,
    startSync,
  ) {
    let destroyPostRenderListener = () => {};
    let cachedViewpoint = new Viewpoint(getModelValue());

    function setupPostRenderListener() {
      destroyPostRenderListener();
      destroyPostRenderListener = app.maps.postRender.addEventListener(
        ({ map }) => {
          const viewpoint = map?.getViewpointSync();
          if (
            !viewpoint ||
            !viewpoint.isValid() ||
            viewpoint.equals(cachedViewpoint, 0.000001)
          ) {
            return;
          }
          emitInput(emit, viewpoint, getModelValue);
          cachedViewpoint = viewpoint;
        },
      );
      if (app.maps.activeMap?.className === OpenlayersMap.className) {
        app.maps.activeMap.requestRender();
      }
    }

    const isObliqueMap = app.maps.activeMap?.className === ObliqueMap.className;
    const active = isObliqueMap ? false : startSync;

    const action = reactive({
      name: 'edit-viewpoint-action',
      icon: active ? 'mdi-sync' : 'mdi-sync-off',
      title: 'components.viewpoint.syncOff',
      disabled: isObliqueMap,
      active,
      callback() {
        this.active = !this.active;
        this.icon = this.active ? 'mdi-sync' : 'mdi-sync-off';
        this.title = this.active
          ? 'components.viewpoint.syncOff'
          : 'components.viewpoint.sync';
        if (this.active) {
          setupPostRenderListener();
        } else {
          destroyPostRenderListener();
        }
      },
    });

    if (action.active) {
      setupPostRenderListener();
    }

    const destroyMapListener = app.maps.mapActivated.addEventListener((map) => {
      destroyPostRenderListener();
      if (action.active) {
        setupPostRenderListener();
      }
      if (map.className === ObliqueMap.className) {
        action.disabled = true;
        if (action.active) {
          action.callback();
        }
      } else {
        action.disabled = false;
      }
      isCesiumMap.value = map.className === CesiumMap.className;
    });

    return {
      action,
      destroy: () => {
        destroyMapListener();
        destroyPostRenderListener();
      },
    };
  }

  /**
   * @param {number} number
   * @returns {boolean|string}
   */
  export function isFiniteNumber(number) {
    return Number.isFinite(number) || 'components.viewpoint.finiteNumber';
  }

  /**
   * @param {number} number
   * @returns {boolean|string}
   */
  export function isPositiveNumber(number) {
    return (
      (Number.isFinite(number) && number > 0) ||
      'components.viewpoint.positiveNumber'
    );
  }

  /**
   * @param {import("@vcmap/ui").VcsUiApp} app
   * @param {import("@vcmap/core").ViewpointOptions} options
   * @returns {Promise<void>}
   */
  export async function gotoViewpointOptions(app, options) {
    const clone = structuredClone(options);
    clone.animate = false;
    const viewpoint = new Viewpoint(clone);
    if (app.maps.activeMap && viewpoint.isValid()) {
      await app.maps.activeMap.gotoViewpoint(viewpoint);
    }
  }

  /**
   * @description A component to model @vcmap/core/ViewpointOptions. Stops playing flights on mounted.
   * @vue-prop {import("@vcmap/core").ViewpointOptions} value - The ViewpointOptions that should be modelled.
   * @vue-prop {boolean} [startSync=true] - Set false to start in manual edit mode, without camera synchronization.
   * @vue-prop {boolean} [expandable] - Expandable sections.
   * @vue-prop {boolean} hideName - Hide name input.
   * @vue-prop {boolean} hideTitle - Hide title input.
   * @vue-prop {boolean} hideAnimate - Hide animate & duration input.
   * @vue-prop {boolean} hideGeneral - Hide all general settings (name, title, animate).
   * @vue-prop {Array<(v:string)=>(boolean|string)>} nameRules - Optional rules for name input.
   */
  export default {
    name: 'VcsViewpointComponent',
    components: {
      VSheet,
      VContainer,
      VRow,
      VCol,
      VcsFormSection,
      VcsLabel,
      VcsTextField,
      VcsCoordinate,
      VcsCheckbox,
      VcsSlider,
    },
    props: {
      modelValue: {
        type: Object,
        default: undefined,
      },
      startSync: {
        type: Boolean,
        default: true,
      },
      expandable: {
        type: Boolean,
        default: false,
      },
      hideName: {
        type: Boolean,
        default: false,
      },
      hideTitle: {
        type: Boolean,
        default: false,
      },
      hideAnimate: {
        type: Boolean,
        default: false,
      },
      hideGeneral: {
        type: Boolean,
        default: false,
      },
      nameRules: {
        type: Array,
        default: () => [],
      },
    },
    setup(props, { emit }) {
      const app = inject('vcsApp');
      const isCesiumMap = ref(
        app.maps.activeMap?.className === CesiumMap.className,
      );

      const name = usePrimitiveProperty(() => props.modelValue, 'name', emit);
      const title = computed({
        get() {
          return props.modelValue?.properties?.title;
        },
        set(value) {
          if (props.modelValue?.properties?.title !== value) {
            const clone = props.modelValue
              ? structuredClone(props.modelValue)
              : {};
            if (clone.properties) {
              clone.properties.title = value;
            } else {
              clone.properties = { title: value };
            }
            emit('update:modelValue', clone);
          }
        },
      });
      const animate = usePrimitiveProperty(
        () => props.modelValue,
        'animate',
        emit,
      );
      const duration = usePrimitiveProperty(
        () => props.modelValue,
        'duration',
        emit,
      );
      const groundPosition = usePrimitiveProperty(
        () => props.modelValue,
        'groundPosition',
        emit,
      );
      const cameraPosition = usePrimitiveProperty(
        () => props.modelValue,
        'cameraPosition',
        emit,
      );
      const distance = usePrimitiveProperty(
        () => props.modelValue,
        'distance',
        emit,
      );
      const hpr = {
        heading: usePrimitiveProperty(() => props.modelValue, 'heading', emit),
        pitch: usePrimitiveProperty(() => props.modelValue, 'pitch', emit),
        roll: usePrimitiveProperty(() => props.modelValue, 'roll', emit),
      };
      const hprSliderOptions = {
        heading: {
          min: 0,
          max: 360,
          step: 1,
        },
        pitch: {
          min: -90,
          max: 90,
          step: 1,
        },
        roll: {
          min: 0,
          max: 360,
          step: 1,
        },
      };

      const updateFromViewAction = {
        name: 'update-viewpoint-from-view-action',
        icon: 'mdi-camera',
        title: 'components.viewpoint.updateFromView',
        async callback() {
          if (app.maps.activeMap) {
            const viewpoint = await app.maps.activeMap.getViewpoint();
            emitInput(emit, viewpoint, () => props.modelValue);
          }
        },
      };

      const { action: editAction, destroy } = createEditingAction(
        app,
        emit,
        () => props.modelValue,
        isCesiumMap,
        props.startSync,
      );

      /**
       * set cameraPosition for 3D if unset
       */
      const mapWatcher = watch(isCesiumMap, () => {
        if (isCesiumMap.value && !cameraPosition.value) {
          cameraPosition.value =
            app.maps.activeMap?.getViewpointSync()?.cameraPosition;
        }
      });

      const disabledWatcher = watch(
        () => editAction.active,
        () => {
          updateFromViewAction.disabled = editAction.active;
        },
      );

      onMounted(() => {
        app.flights.player?.stop();
      });

      onUnmounted(() => {
        destroy();
        mapWatcher();
        disabledWatcher();
      });

      async function gotoViewpoint() {
        await gotoViewpointOptions(app, props.modelValue);
      }

      async function handleInput(key) {
        if (app.maps.activeMap) {
          if (key === 'groundPosition') {
            cameraPosition.value = undefined;
          } else if (key === 'cameraPosition') {
            groundPosition.value = (
              await app.maps.activeMap.getViewpoint()
            ).groundPosition;
          }
          await gotoViewpoint();
        }
      }

      return {
        isCesiumMap,
        gotoViewpoint,
        handleInput,
        updateFromViewAction,
        editAction,
        name,
        title,
        animate,
        duration,
        groundPosition,
        cameraPosition,
        distance,
        hpr,
        hprSliderOptions,
        isFiniteNumber,
        isPositiveNumber,
      };
    },
  };
</script>
