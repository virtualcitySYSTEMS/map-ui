<template>
  <VcsFormSection
    class="vcs-vector-properties-component"
    :heading="$attrs.heading || 'components.vectorProperties.header'"
    :expandable="expandable"
    :start-open="startOpen"
    :header-actions="headerActions"
  >
    <v-container class="px-1 py-0">
      <template v-if="show3DProperties">
        <v-row v-if="visibleProperties.has('altitudeMode')" no-gutters>
          <v-col>
            <VcsLabel :html-for="`${cid}-vp-altitude-mode`"
              >{{ $t('components.vectorProperties.altitudeMode') }}
              <template #help>
                <ul>
                  <li v-for="mode in availableAltitudeModes" :key="mode.value">
                    {{ $t(mode.title) }}:
                    {{ $t(`components.vectorProperties.help.${mode.value}`) }}
                  </li>
                </ul>
              </template>
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              :id="`${cid}-vp-altitude-mode`"
              :items="availableAltitudeModes"
              v-model="localValue.altitudeMode"
            />
          </v-col>
        </v-row>
        <v-row v-if="visibleProperties.has('heightAboveGround')" no-gutters>
          <v-col>
            <VcsLabel :html-for="`${cid}-vp-height-above-ground`">{{
              $t('components.vectorProperties.heightAboveGround')
            }}</VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-vp-height-above-ground`"
              v-model.number="localValue.heightAboveGround"
              :hide-spin-buttons="true"
              type="number"
              unit="m"
              clearable
            />
          </v-col>
        </v-row>
        <v-row v-if="visibleProperties.has('groundLevel')" no-gutters>
          <v-col>
            <VcsLabel :html-for="`${cid}-vp-ground-level`">{{
              $t('components.vectorProperties.groundLevel')
            }}</VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-vp-ground-level`"
              v-model.number="localValue.groundLevel"
              :hide-spin-buttons="true"
              type="number"
              unit="m"
              placeholder="0"
              clearable
            />
          </v-col>
        </v-row>
        <template v-if="visibleProperties.has('scaleByDistance')">
          <v-row no-gutters>
            <v-col cols="6">
              <VcsCheckbox
                label="components.vectorProperties.scaleByDistance"
                v-model="hasScaleByDistance"
              />
            </v-col>
          </v-row>
          <template v-if="hasScaleByDistance">
            <v-row no-gutters class="pb-2">
              <v-col
                v-for="(_, index) in localValue.scaleByDistance"
                :key="index"
              >
                <VcsTextField
                  v-model="localValue.scaleByDistance[index]"
                  :hide-spin-buttons="true"
                  type="number"
                  :unit="index % 2 === 0 ? 'm' : ''"
                  :disabled="!localValue.scaleByDistance"
                  :placeholder="String(scaleByDistanceDefault[index])"
                  :rules="[
                    (v) =>
                      !hasScaleByDistance ||
                      !isNaN(v) ||
                      'components.validation.required',
                  ]"
                />
              </v-col>
            </v-row>
          </template>
        </template>
        <template v-if="visibleProperties.has('eyeOffset')">
          <v-row no-gutters>
            <v-col>
              <VcsCheckbox
                label="components.vectorProperties.eyeOffset"
                v-model="hasEyeOffset"
              />
            </v-col>
          </v-row>
          <template v-if="hasEyeOffset">
            <v-row no-gutters class="pb-2">
              <v-col v-for="(_, index) in localValue.eyeOffset" :key="index">
                <VcsTextField
                  v-model.number="localValue.eyeOffset[index]"
                  unit="m"
                  :hide-spin-buttons="true"
                  type="number"
                  :disabled="!hasEyeOffset"
                  :prefix="dimensionsUpperCase[index]"
                  :rules="[
                    (v) =>
                      !hasEyeOffset ||
                      !isNaN(v) ||
                      'components.validation.required',
                  ]"
                  :placeholder="String(eyeOffsetDefault[index])"
                />
              </v-col>
            </v-row>
          </template>
        </template>
      </template>
      <v-row v-if="visibleProperties.has('allowPicking')" no-gutters>
        <v-col>
          <VcsCheckbox
            label="components.vectorProperties.allowPicking"
            v-model="localValue.allowPicking"
            :true-value="true"
            :false-value="false"
          />
        </v-col>
      </v-row>
      <v-row
        v-if="visibleProperties.has('classificationType') && show3DProperties"
        no-gutters
      >
        <v-col>
          <VcsLabel :html-for="`${cid}-vp-classification-type`">
            {{ $t('components.vectorProperties.classificationType') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsSelect
            :id="`${cid}-vp-classification-type`"
            :items="availableClassificationTypes"
            v-model="classificationType"
          />
        </v-col>
      </v-row>
    </v-container>
    <template v-if="show3DProperties">
      <v-divider
        v-if="
          showDividers &&
          [
            'extrudedHeight',
            'skirt',
            'storeysAboveGround',
            'storeysBelowGround',
            'storeyHeightsAboveGround',
            'storeyHeightsBelowGround',
          ].some((prop) => visibleProperties.has(prop))
        "
      />
      <v-container class="px-1 py-0">
        <v-row
          v-if="
            visibleProperties.has('storeysAboveGround') ||
            visibleProperties.has('storeyHeightsAboveGround')
          "
          no-gutters
        >
          <v-col>
            <VcsLabel>{{
              $t('components.vectorProperties.aboveGround')
            }}</VcsLabel>
          </v-col>
        </v-row>
        <v-row v-if="visibleProperties.has('extrudedHeight')" no-gutters>
          <v-col>
            <VcsLabel
              :html-for="`${cid}-vp-extruded-height`"
              :class="{
                'px-4':
                  visibleProperties.has('storeysAboveGround') ||
                  visibleProperties.has('storeyHeightsAboveGround'),
              }"
              >{{ $t('components.vectorProperties.extrudedHeight') }}</VcsLabel
            >
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-vp-extruded-height`"
              v-model.number="localValue.extrudedHeight"
              :hide-spin-buttons="true"
              type="number"
              unit="m"
              :placeholder="'extrudedHeight' in localValue ? '0' : ''"
              clearable
              :rules="[
                (v) => v >= 0 || isNaN(v) || 'components.validation.notValid',
              ]"
            />
          </v-col>
        </v-row>
        <v-row v-if="visibleProperties.has('storeysAboveGround')" no-gutters>
          <v-col>
            <VcsLabel :html-for="`${cid}-vp-storeys-above`" class="px-4">{{
              $t('components.vectorProperties.storeys')
            }}</VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-vp-storeys-above`"
              v-model.number="localValue.storeysAboveGround"
              :hide-spin-buttons="true"
              type="number"
              :placeholder="'storeysAboveGround' in localValue ? '0' : ''"
              clearable
              :rules="[
                (v) => v >= 0 || isNaN(v) || 'components.validation.notValid',
              ]"
            />
          </v-col>
        </v-row>
        <v-row
          v-if="visibleProperties.has('storeyHeightsAboveGround')"
          no-gutters
        >
          <v-col>
            <VcsLabel
              :html-for="`${cid}-vp-storey-heights-above`"
              class="px-4"
              >{{ $t('components.vectorProperties.storeyHeights') }}</VcsLabel
            >
          </v-col>
          <v-col>
            <VcsChipArrayInput
              :id="`${cid}-vp-storey-heights-above`"
              column
              type="number"
              v-model="storeyHeights.storeyHeightsAboveGround.value"
              placeholder="3"
              :rules="[(v) => !(v <= 0) || 'components.validation.notValid']"
            />
          </v-col>
        </v-row>
        <v-row
          v-if="
            visibleProperties.has('storeysBelowGround') ||
            visibleProperties.has('storeyHeightsBelowGround')
          "
          no-gutters
        >
          <v-col>
            <VcsLabel>{{
              $t('components.vectorProperties.belowGround')
            }}</VcsLabel>
          </v-col>
        </v-row>
        <v-row v-if="visibleProperties.has('skirt')" no-gutters>
          <v-col>
            <VcsLabel
              :html-for="`${cid}-vp-skirt`"
              :class="{
                'px-4':
                  visibleProperties.has('storeysBelowGround') ||
                  visibleProperties.has('storeyHeightsBelowGround'),
              }"
              >{{ $t('components.vectorProperties.skirt') }}</VcsLabel
            >
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-vp-skirt`"
              v-model.number="localValue.skirt"
              :hide-spin-buttons="true"
              type="number"
              unit="m"
              :placeholder="'skirt' in localValue ? '0' : ''"
              clearable
              :rules="[
                (v) => v >= 0 || isNaN(v) || 'components.validation.notValid',
              ]"
            />
          </v-col>
        </v-row>
        <v-row v-if="visibleProperties.has('storeysBelowGround')" no-gutters>
          <v-col>
            <VcsLabel :html-for="`${cid}-vp-storeys-below`" class="px-4">{{
              $t('components.vectorProperties.storeys')
            }}</VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-vp-storeys-below`"
              v-model.number="localValue.storeysBelowGround"
              :hide-spin-buttons="true"
              type="number"
              :placeholder="'storeysBelowGround' in localValue ? '0' : ''"
              clearable
              :rules="[
                (v) => v >= 0 || isNaN(v) || 'components.validation.notValid',
              ]"
            />
          </v-col>
        </v-row>
        <v-row
          v-if="visibleProperties.has('storeyHeightsBelowGround')"
          no-gutters
        >
          <v-col>
            <VcsLabel
              :html-for="`${cid}-vp-storey-heights-below`"
              class="px-4"
              >{{ $t('components.vectorProperties.storeyHeights') }}</VcsLabel
            >
          </v-col>
          <v-col>
            <VcsChipArrayInput
              :id="`${cid}-vp-storey-heights-below`"
              column
              type="number"
              v-model="storeyHeights.storeyHeightsBelowGround.value"
              placeholder="3"
            />
          </v-col>
        </v-row>
      </v-container>
      <v-divider
        v-if="
          showDividers &&
          [
            'modelUrl',
            'modelScaleX',
            'modelScaleY',
            'modelScaleZ',
            'modelHeading',
            'modelPitch',
            'modelRoll',
            'modelAutoScale',
            'baseUrl',
          ].some((prop) => visibleProperties.has(prop))
        "
      />
      <v-container class="px-1 py-0">
        <v-row v-if="visibleProperties.has('modelUrl')" no-gutters>
          <v-col>
            <VcsLabel :html-for="`${cid}-vp-model-url`">
              {{ $t('components.vectorProperties.modelUrl') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-vp-model-url`"
              v-model="localValue.modelUrl"
              clearable
              :placeholder="'modelUrl' in localValue ? 'example.glb' : ''"
            />
          </v-col>
        </v-row>
        <template v-if="Object.keys(modelScale).length">
          <v-row no-gutters>
            <v-col cols="6">
              <VcsLabel>{{
                $t('components.vectorProperties.modelScale')
              }}</VcsLabel>
            </v-col>
          </v-row>
          <v-row no-gutters class="pb-2">
            <v-col v-for="(dimension, key) in modelScale" :key="key">
              <VcsTextField
                v-model.number="dimension.value"
                :hide-spin-buttons="true"
                type="number"
                :placeholder="`modelScale${key}` in localValue ? '1' : ''"
                :prefix="key"
                :rules="[(v) => v > 0 || 'components.validation.notValid']"
              />
            </v-col>
          </v-row>
        </template>
        <v-row v-if="visibleProperties.has('modelHeading')" no-gutters>
          <v-col cols="6">
            <VcsLabel :html-for="`${cid}-vp-model-heading`">{{
              $t('components.vectorProperties.modelHeading')
            }}</VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-vp-model-heading`"
              v-model.number="localValue.modelHeading"
              :hide-spin-buttons="true"
              type="number"
              :placeholder="'modelHeading' in localValue ? '0' : ''"
              unit="°"
              clearable
            />
          </v-col>
        </v-row>
        <v-row v-if="visibleProperties.has('modelPitch')" no-gutters>
          <v-col cols="6">
            <VcsLabel :html-for="`${cid}-vp-model-pitch`">{{
              $t('components.vectorProperties.modelPitch')
            }}</VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-vp-model-pitch`"
              v-model.number="localValue.modelPitch"
              :hide-spin-buttons="true"
              type="number"
              :placeholder="'modelPitch' in localValue ? '0' : ''"
              unit="°"
              clearable
            />
          </v-col>
        </v-row>
        <v-row v-if="visibleProperties.has('modelRoll')" no-gutters>
          <v-col cols="6">
            <VcsLabel :html-for="`${cid}-vp-model-roll`">{{
              $t('components.vectorProperties.modelRoll')
            }}</VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-vp-model-roll`"
              v-model.number="localValue.modelRoll"
              :hide-spin-buttons="true"
              type="number"
              :placeholder="'modelRoll' in localValue ? '0' : ''"
              unit="°"
              clearable
            />
          </v-col>
        </v-row>
        <v-row v-if="visibleProperties.has('modelAutoScale')" no-gutters>
          <v-col cols="6">
            <VcsLabel>{{
              $t('components.vectorProperties.modelAutoScale')
            }}</VcsLabel>
          </v-col>
          <v-col>
            <VcsCheckbox v-model="localValue.modelAutoScale" />
          </v-col>
        </v-row>
        <v-row v-if="visibleProperties.has('baseUrl')" no-gutters>
          <v-col>
            <VcsLabel :html-for="`${cid}-vp-base-url`">{{
              $t('components.vectorProperties.baseUrl')
            }}</VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              :id="`${cid}-vp-base-url`"
              clearable
              v-model="localValue.baseUrl"
              :placeholder="'baseUrl' in localValue ? 'path/to/files/' : ''"
            />
          </v-col>
        </v-row>
      </v-container>
    </template>
  </VcsFormSection>
</template>
<script>
  import { computed, toRaw } from 'vue';
  import { VContainer, VRow, VCol, VDivider } from 'vuetify/components';
  import { VectorProperties } from '@vcmap/core';
  import {
    useProxiedComplexModel,
    useModelHasProperty,
  } from '../modelHelper.js';
  import VcsFormSection from '../section/VcsFormSection.vue';
  import VcsLabel from '../form-inputs-controls/VcsLabel.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.vue';
  import VcsSelect from '../form-inputs-controls/VcsSelect.vue';
  import VcsCheckbox from '../form-inputs-controls/VcsCheckbox.vue';
  import VcsChipArrayInput from '../form-inputs-controls/VcsChipArrayInput.vue';
  import { useComponentId } from '../composables.js';

  export const genericVectorProperties = [
    'altitudeMode',
    'allowPicking',
    'groundLevel',
    'heightAboveGround',
    'skirt',
    'extrudedHeight',
  ];

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
  ];

  export const nonPointVectorProperties = [
    'classificationType',
    'storeysAboveGround',
    'storeysBelowGround',
    'storeyHeightsAboveGround',
    'storeyHeightsBelowGround',
  ];

  export const vectorProperties = [
    ...genericVectorProperties,
    ...nonPointVectorProperties,
    ...pointVectorProperties,
  ];

  export const scaleByDistanceDefault = [0, 1, 1, 1];
  export const eyeOffsetDefault = [0, 0, 0];
  export const dimensionsUpperCase = ['X', 'Y', 'Z'];

  /**
   * @description Allows to model VectorPropertiesOptions. If a key is not part of the options, the corresponding input field stays empty.
   * @vue-prop {import("@vcmap/core").VectorPropertiesOptions} value - The options to be modelled.
   * @vue-prop {import("@vcmap/core").VectorPropertiesOptions} valueDefault - The default VectorPropertiesOptions that are applied when clicking the "Reset" button.
   * @vue-prop {Array<string>} properties - The keys of the VectorPropertiesOptions that should be editable. If a key is not within this array, the corresponding input field is not shown.
   * @vue-prop {boolean} show3DProperties - Whether the 3D related properties should be shown or not.
   * @vue-prop {boolean} [showDividers=true] - Wether the dividers, which group similar properties, should be shown.
   * @vue-prop {string} [heading='Vector properties'] - Title of the form section, will be translated.
   * @vue-prop {boolean} [expandable=false] - If true, form section can be toggled.
   * @vue-prop {boolean} [startOpen=false] - If form section starts open.
   * @vue-prop {boolean} [showReset=true] - If a reset action is added to the form header.
   * @vue-event {import("@vcmap/core").VectorPropertiesOptions} input - Emits the updated VectorPropertiesOptions each time a property is changed.
   * @vue-event {import("@vcmap/core").VectorPropertiesOptions} propertyChange - Emits the updated VectorPropertiesOptions, containing only the keys that changed, each time a property is changed.
   */
  export default {
    name: 'VcsVectorPropertiesComponent',
    components: {
      VcsFormSection,
      VcsLabel,
      VcsSelect,
      VcsTextField,
      VcsCheckbox,
      VcsChipArrayInput,
      VContainer,
      VRow,
      VCol,
      VDivider,
    },
    props: {
      modelValue: {
        type: Object,
        default: () => VectorProperties.getDefaultOptions(),
      },
      valueDefault: {
        type: Object,
        required: true,
      },
      properties: {
        type: Array,
        default: () => vectorProperties,
      },
      altitudeModes: {
        type: Array,
        default: () => [
          'absolute',
          'relativeToGround',
          'relativeToTerrain',
          'relativeTo3DTiles',
          'clampToGround',
          'clampToTerrain',
          'clampTo3DTiles',
        ],
      },
      show3DProperties: {
        type: Boolean,
        default: true,
      },
      is2DFeature: {
        type: Boolean,
        default: false,
      },
      showDividers: {
        type: Boolean,
        default: true,
      },
      expandable: {
        type: Boolean,
        default: false,
      },
      startOpen: {
        type: Boolean,
        default: false,
      },
      showReset: {
        type: Boolean,
        default: true,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      /**
       * @type {import("vue").Ref<import("vue").UnwrapRef<import("@vcmap/core").VectorProperties>>}
       */
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);

      const visibleProperties = computed(() => {
        return new Set(props.properties);
      });

      const availableAltitudeModes = computed(() => {
        return [
          {
            value: 'clampToGround',
            title: 'components.vectorProperties.clampToGround',
          },
          {
            value: 'clampToTerrain',
            title: 'components.vectorProperties.clampToTerrain',
          },
          {
            value: 'clampTo3DTiles',
            title: 'components.vectorProperties.clampTo3DTiles',
          },
          {
            value: 'absolute',
            title: 'components.vectorProperties.absolute',
            props: {
              disabled: props.is2DFeature,
            },
          },
          {
            value: 'relativeToGround',
            title: 'components.vectorProperties.relativeToGround',
          },
          {
            value: 'relativeToTerrain',
            title: 'components.vectorProperties.relativeToTerrain',
          },
          {
            value: 'relativeTo3DTiles',
            title: 'components.vectorProperties.relativeTo3DTiles',
          },
        ].filter((item) => props.altitudeModes.includes(item.value));
      });

      const availableClassificationTypes = [
        { value: 'none', title: 'components.vectorProperties.none' },
        { value: 'both', title: 'components.vectorProperties.both' },
        {
          value: 'cesium3DTile',
          title: 'components.vectorProperties.cesium3DTile',
        },
        { value: 'terrain', title: 'components.vectorProperties.terrain' },
      ];

      const classificationType = computed({
        get() {
          if ('classificationType' in localValue.value) {
            return localValue.value.classificationType || 'none';
          } else {
            return undefined;
          }
        },
        set(value) {
          const v = value === 'none' ? undefined : value;
          if (localValue.value.classificationType !== v) {
            localValue.value.classificationType = v;
          }
        },
      });

      const hasScaleByDistance = useModelHasProperty(
        localValue,
        'scaleByDistance',
        scaleByDistanceDefault,
      );

      const hasEyeOffset = useModelHasProperty(
        localValue,
        'eyeOffset',
        eyeOffsetDefault,
      );

      const storeyHeights = computed(() => {
        return ['storeyHeightsAboveGround', 'storeyHeightsBelowGround']
          .filter((key) => visibleProperties.value.has(key))
          .reduce((acc, key) => {
            acc[key] = computed({
              get() {
                if (Array.isArray(localValue.value[key])) {
                  return localValue.value[key];
                } else if (localValue.value[key] > 0) {
                  return [localValue.value[key]];
                } else {
                  return [];
                }
              },
              set(value) {
                localValue.value[key] = value;
              },
            });
            return acc;
          }, {});
      });

      const modelScale = computed(() => {
        return dimensionsUpperCase
          .filter((dimension) =>
            visibleProperties.value.has(`modelScale${dimension}`),
          )
          .reduce((acc, dimension) => {
            return {
              ...acc,
              [dimension]: computed({
                get() {
                  return localValue.value[`modelScale${dimension}`];
                },
                set(value) {
                  localValue.value[`modelScale${dimension}`] = value;
                },
              }),
            };
          }, {});
      });

      const headerActions = computed(() =>
        props.showReset
          ? [
              {
                name: 'reset',
                title: 'components.style.reset',
                icon: '$vcsReturn',
                callback: () => {
                  localValue.value = structuredClone(toRaw(props.valueDefault));
                },
              },
            ]
          : [],
      );

      const cid = useComponentId();

      return {
        localValue,
        headerActions,
        visibleProperties,
        availableAltitudeModes,
        availableClassificationTypes,
        classificationType,
        hasScaleByDistance,
        scaleByDistanceDefault,
        hasEyeOffset,
        eyeOffsetDefault,
        storeyHeights,
        modelScale,
        dimensionsUpperCase,
        cid,
      };
    },
    methods: { computed },
  };
</script>
