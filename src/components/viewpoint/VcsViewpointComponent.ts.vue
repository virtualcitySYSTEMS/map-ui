<template>
  <v-sheet class="vcs-viewpoint-component">
    <VcsFormSection
      heading="components.viewpoint.general"
      :expandable="expandable"
      start-open
      v-if="!(hideGeneral || (hideName && hideTitle && hideAnimate))"
    >
      <v-container class="py-0 px-1">
        <v-row no-gutters v-if="!hideName">
          <v-col cols="6">
            <VcsLabel :html-for="`${cid}-name`" required>
              {{ $st('components.viewpoint.name') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-name`"
              clearable
              v-model="localValue.name"
              :rules="nameRules"
            />
          </v-col>
        </v-row>
        <v-row no-gutters v-if="!hideTitle">
          <v-col cols="6">
            <VcsLabel :html-for="`${cid}-title`">
              {{ $st('components.viewpoint.title') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-title`"
              clearable
              :placeholder="$st('components.viewpoint.titlePlaceholder')"
              v-model="title"
            />
          </v-col>
        </v-row>
        <v-row no-gutters v-if="!hideAnimate">
          <v-col cols="6">
            <VcsCheckbox
              label="components.viewpoint.animate"
              v-model="localValue.animate"
            />
          </v-col>
          <v-col>
            <VcsTextField
              v-if="localValue.animate"
              clearable
              :hide-spin-buttons="true"
              type="number"
              :min="1"
              unit="s"
              :title="$st('components.viewpoint.duration')"
              v-model.number="localValue.duration"
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
              <VcsLabel html-for="groundPosition">
                {{ $st('components.viewpoint.groundPosition') }}
              </VcsLabel>
            </v-col>
          </v-row>
          <VcsCoordinate
            :model-value="localValue.groundPosition"
            :disabled="editAction.active"
            @blur="gotoViewpoint"
            @update:model-value="(v) => handleInput('groundPosition', v)"
            hide-z
          />
        </template>
        <template v-else>
          <v-row no-gutters>
            <v-col cols="6">
              <VcsLabel html-for="cameraPosition">
                {{ $st('components.viewpoint.cameraPosition') }}
              </VcsLabel>
            </v-col>
          </v-row>
          <VcsCoordinate
            :model-value="localValue.cameraPosition"
            :disabled="editAction.active"
            @blur="gotoViewpoint"
            @update:model-value="(v) => handleInput('cameraPosition', v)"
          />
        </template>
        <template v-if="!isCesiumMap">
          <v-row no-gutters>
            <v-col>
              <VcsLabel :html-for="`${cid}-distance`">
                {{ $st('components.viewpoint.distance') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                :id="`${cid}-distance`"
                :min="0"
                :step="100"
                prefix="d"
                unit="m"
                :decimals="2"
                :hide-spin-buttons="true"
                type="number"
                v-model.number="localValue.distance"
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
            <VcsLabeledSlider
              :disabled="editAction.active"
              :label="`components.viewpoint.${key}`"
              unit="°"
              allow-text-input
              text-input-cols="3"
              hide-spin-buttons
              v-bind="hprSliderOptions[key as keyof typeof hprSliderOptions]"
              v-model="localValue[key]"
              @blur="gotoViewpoint"
              @update:model-value="gotoViewpoint"
            />
          </div>
        </template>
      </v-container>
    </VcsFormSection>
  </v-sheet>
</template>

<script lang="ts">
  import type { Coordinate } from 'ol/coordinate.js';
  import {
    computed,
    defineComponent,
    inject,
    onMounted,
    onUnmounted,
    reactive,
    ref,
    toRaw,
    watch,
  } from 'vue';
  import type { PropType, Ref } from 'vue';
  import { VSheet, VContainer, VRow, VCol } from 'vuetify/components';
  import { CesiumMap, ObliqueMap, OpenlayersMap, Viewpoint } from '@vcmap/core';
  import type { ViewpointOptions } from '@vcmap/core';
  import VcsFormSection from '../section/VcsFormSection.ts.vue';
  import VcsLabel from '../form-inputs-controls/VcsLabel.ts.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.ts.vue';
  import VcsCheckbox from '../form-inputs-controls/VcsCheckbox.ts.vue';
  import VcsCoordinate from '../form-inputs-controls/VcsCoordinate.ts.vue';
  import VcsLabeledSlider from '../form-inputs-controls/VcsLabeledSlider.ts.vue';
  import { useProxiedComplexModel } from '../modelHelper.js';
  import { useComponentId } from '../composables.js';
  import type { VcsAction } from '../../actions/actionHelper.js';
  import type VcsUiApp from '../../vcsUiApp.js';

  /**
   * Updates the localValue ref by keeping name and properties
   */
  function updateLocalValueFromViewpoint(
    localValue: Ref<ViewpointOptions>,
    viewpoint: Viewpoint,
  ): void {
    const options = viewpoint.toJSON();
    options.name = localValue.value.name;
    options.animate = localValue.value.animate;
    options.duration = localValue.value.duration;
    if (localValue.value.properties) {
      options.properties = toRaw(localValue.value.properties);
    }
    localValue.value = options;
  }

  /**
   * Set up post render handler, if action is active.
   * If action is inactive, destroy post render handler to allow manual editing.
   * @param startSync - whether to set up post render handler on creation
   */
  function createEditingAction(
    app: VcsUiApp,
    localValue: Ref<ViewpointOptions>,
    isCesiumMap: Ref<boolean>,
    startSync: boolean,
  ): { action: VcsAction; destroy: () => void } {
    let destroyPostRenderListener = (): void => {};
    let cachedViewpoint = new Viewpoint(localValue.value);

    function setupPostRenderListener(): void {
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
          updateLocalValueFromViewpoint(localValue, viewpoint);
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
      destroy: (): void => {
        destroyMapListener();
        destroyPostRenderListener();
      },
    };
  }

  export function isFiniteNumber(number: number): boolean | string {
    return Number.isFinite(number) || 'components.viewpoint.finiteNumber';
  }

  export function isPositiveNumber(number: number): boolean | string {
    return (
      (Number.isFinite(number) && number > 0) ||
      'components.viewpoint.positiveNumber'
    );
  }

  export async function gotoViewpointOptions(
    app: VcsUiApp,
    options: ViewpointOptions,
  ): Promise<void> {
    const viewpoint = new Viewpoint({
      ...options,
      animate: false,
    });
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
  export default defineComponent({
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
      VcsLabeledSlider,
    },
    props: {
      modelValue: {
        type: Object as PropType<ViewpointOptions>,
        default: Viewpoint.getDefaultOptions(),
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
        type: Array as PropType<Array<(v: string) => boolean | string>>,
        default: () => [],
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const app = inject('vcsApp') as VcsUiApp;
      const isCesiumMap = ref(
        app.maps.activeMap?.className === CesiumMap.className,
      );
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);

      const title = computed({
        get() {
          return localValue.value.properties?.title as string | undefined;
        },
        set(value) {
          if (localValue.value.properties?.title !== value) {
            if (localValue.value.properties) {
              localValue.value.properties.title = value;
            } else {
              localValue.value.properties = { title: value };
            }
          }
        },
      });

      const hprSliderOptions = {
        heading: { min: 0, max: 360, step: 1 },
        pitch: { min: -90, max: 90, step: 1 },
        roll: { min: 0, max: 360, step: 1 },
      };

      const updateFromViewAction = reactive<VcsAction>({
        name: 'update-viewpoint-from-view-action',
        icon: 'mdi-camera',
        title: 'components.viewpoint.updateFromView',
        async callback() {
          if (app.maps.activeMap) {
            updateLocalValueFromViewpoint(
              localValue,
              (await app.maps.activeMap.getViewpoint()) as Viewpoint,
            );
          }
        },
      });

      const { action: editAction, destroy } = createEditingAction(
        app,
        localValue,
        isCesiumMap,
        props.startSync,
      );

      /**
       * set cameraPosition for 3D if unset
       */
      const mapWatcher = watch(isCesiumMap, () => {
        if (isCesiumMap.value && !localValue.value.cameraPosition) {
          const cameraPosition =
            app.maps.activeMap?.getViewpointSync()?.cameraPosition;
          localValue.value.cameraPosition = cameraPosition ?? undefined;
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

      async function gotoViewpoint(): Promise<void> {
        await gotoViewpointOptions(app, localValue.value);
      }

      async function handleInput(
        key: 'groundPosition' | 'cameraPosition',
        value: Coordinate | undefined,
      ): Promise<void> {
        localValue.value[key] = value;
        if (app.maps.activeMap) {
          if (key === 'groundPosition') {
            localValue.value.cameraPosition = undefined;
          } else if (key === 'cameraPosition') {
            const { groundPosition } =
              (await app.maps.activeMap.getViewpoint()) as Viewpoint;
            localValue.value.groundPosition = groundPosition ?? undefined;
          }
          await gotoViewpoint();
        }
      }

      const cid = useComponentId();

      return {
        isCesiumMap,
        localValue,
        title,
        gotoViewpoint,
        handleInput,
        updateFromViewAction,
        editAction,
        hprSliderOptions,
        isFiniteNumber,
        isPositiveNumber,
        cid,
      };
    },
  });
</script>
