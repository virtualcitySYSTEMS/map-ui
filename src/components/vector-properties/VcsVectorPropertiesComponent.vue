<template>
  <VcsFormSection
    :heading="$attrs.heading || 'components.vectorProperties.header'"
    :expandable="$attrs.expandable"
    :start-open="$attrs.startOpen"
    :header-actions="[
      {
        name: 'reset',
        title: 'components.style.reset',
        icon: '$vcsReturn',
        callback: () => {
          reset();
        },
      },
    ]"
  >
    <v-container class="px-1 py-0">
      <v-row
        v-if="visibleProperties.has('altitudeMode') && show3DProperties"
        no-gutters
      >
        <v-col>
          <VcsLabel html-for="vp-altitude-mode">{{
            $t('components.vectorProperties.altitudeMode')
          }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsSelect
            id="vp-altitude-mode"
            :items="[
              {
                value: 'clampToGround',
                text: 'components.vectorProperties.clampToGround',
              },
              {
                value: 'absolute',
                text: 'components.vectorProperties.absolute',
              },
              {
                value: 'relativeToGround',
                text: 'components.vectorProperties.relativeToGround',
              },
            ]"
            v-model="altitudeMode"
            dense
          />
        </v-col>
      </v-row>
      <v-row
        v-if="altitudeMode === 'relativeToGround' && show3DProperties"
        no-gutters
      >
        <v-col>
          <VcsLabel html-for="vp-height-above-ground">{{
            $t('components.vectorProperties.heightAboveGround')
          }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            id="vp-height-above-ground"
            dense
            v-model.number="heightAboveGround"
            type="number"
            unit="m"
            :placeholder="'heightAboveGround' in value ? '0 m' : ''"
          />
        </v-col>
      </v-row>
      <v-row
        v-if="visibleProperties.has('groundLevel') && show3DProperties"
        no-gutters
      >
        <v-col>
          <VcsLabel html-for="vp-ground-level">{{
            $t('components.vectorProperties.groundLevel')
          }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            id="vp-ground-level"
            dense
            v-model.number="groundLevel"
            type="number"
            unit="m"
            :placeholder="'groundLevel' in value ? '0 m' : ''"
            clearable
          />
        </v-col>
      </v-row>
      <v-row
        v-if="visibleProperties.has('scaleByDistance') && show3DProperties"
        no-gutters
      >
        <v-col>
          <VcsCheckbox
            label="components.vectorProperties.scaleByDistance"
            v-model="hasScaleByDistance"
          />
        </v-col>
        <v-col>
          <v-row no-gutters>
            <v-col v-for="(nearFar, index) in scaleByDistance" :key="index">
              <VcsTextField
                dense
                v-model.number="nearFar.value"
                type="number"
                :unit="index % 2 === 0 ? 'm' : ''"
                :disabled="!hasScaleByDistance"
                :placeholder="
                  'scaleByDistance' in value
                    ? index % 2 === 0
                      ? `${scaleByDistanceDefault[index]} m`
                      : `${scaleByDistanceDefault[index]}`
                    : ''
                "
                :rules="[
                  (v) =>
                    !hasScaleByDistance ||
                    !isNaN(v) ||
                    'components.validation.required',
                ]"
              />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-row
        v-if="visibleProperties.has('eyeOffset') && show3DProperties"
        no-gutters
      >
        <v-col>
          <VcsCheckbox
            label="components.vectorProperties.eyeOffset"
            v-model="hasEyeOffset"
          />
        </v-col>
        <v-col v-for="(distance, index) in eyeOffset" :key="index" cols="2">
          <VcsTextField
            dense
            v-model.number="distance.value"
            unit="m"
            type="number"
            :disabled="!hasEyeOffset"
            :prefix="dimensionsUpperCase[index]"
            :rules="[
              (v) =>
                !hasEyeOffset || !isNaN(v) || 'components.validation.required',
            ]"
            :placeholder="
              'eyeOffset' in value ? `${eyeOffsetDefault[index]} m` : ''
            "
          />
        </v-col>
      </v-row>
      <v-row v-if="visibleProperties.has('allowPicking')" no-gutters>
        <v-col>
          <VcsCheckbox
            label="components.vectorProperties.allowPicking"
            v-model="allowPicking"
          />
        </v-col>
      </v-row>
      <v-row
        v-if="visibleProperties.has('classificationType') && show3DProperties"
        no-gutters
      >
        <v-col>
          <VcsLabel html-for="vp-classification-type" :dense="true">
            {{ $t('components.vectorProperties.classificationType') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsSelect
            id="vp-classification-type"
            :items="[
              { value: 'none', text: 'components.vectorProperties.none' },
              { value: 'both', text: 'components.vectorProperties.both' },
              {
                value: 'cesium3DTile',
                text: 'components.vectorProperties.cesium3DTile',
              },
              { value: 'terrain', text: 'components.vectorProperties.terrain' },
            ]"
            v-model="classificationType"
            dense
          />
        </v-col>
      </v-row>
    </v-container>
    <v-divider
      v-if="
        !hideDividers &&
        show3DProperties &&
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
    <v-container class="px-1 py-0" v-if="show3DProperties">
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
            html-for="vp-extruded-height"
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
            id="vp-extruded-height"
            dense
            v-model.number="extrudedHeight"
            type="number"
            unit="m"
            :placeholder="'extrudedHeight' in value ? '0 m' : ''"
            clearable
            :rules="[
              (v) => v >= 0 || isNaN(v) || 'components.validation.notValid',
            ]"
          />
        </v-col>
      </v-row>
      <v-row v-if="visibleProperties.has('storeysAboveGround')" no-gutters>
        <v-col>
          <VcsLabel html-for="vp-storeys-above" class="px-4">{{
            $t('components.vectorProperties.storeys')
          }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            id="vp-storeys-above"
            dense
            v-model.number="storeysAboveGround"
            type="number"
            :placeholder="'storeysAboveGround' in value ? '0' : ''"
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
          <VcsLabel :html-for="'vp-storey-heights-above'" class="px-4">{{
            $t('components.vectorProperties.storeyHeights')
          }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsChipArrayInput
            id="vp-storey-heights-above"
            dense
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
            html-for="vp-skirt"
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
            id="vp-skirt"
            dense
            v-model.number="skirt"
            type="number"
            unit="m"
            :placeholder="'skirt' in value ? '0 m' : ''"
            clearable
            :rules="[
              (v) => v >= 0 || isNaN(v) || 'components.validation.notValid',
            ]"
          />
        </v-col>
      </v-row>
      <v-row v-if="visibleProperties.has('storeysBelowGround')" no-gutters>
        <v-col>
          <VcsLabel html-for="vp-storeys-below" class="px-4">{{
            $t('components.vectorProperties.storeys')
          }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            id="vp-storeys-below"
            dense
            v-model.number="storeysBelowGround"
            type="number"
            :placeholder="'storeysBelowGround' in value ? '0' : ''"
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
          <VcsLabel :html-for="'vp-storey-heights-below'" class="px-4">{{
            $t('components.vectorProperties.storeyHeights')
          }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsChipArrayInput
            :id="'vp-storey-heights-below'"
            dense
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
        !hideDividers &&
        show3DProperties &&
        [
          'modelUrl',
          'modelScaleX',
          'modelScaleY',
          'modelScaleZ',
          'modelHeading',
          'modelPitch',
          'modelRoll',
          'baseUrl',
        ].some((prop) => visibleProperties.has(prop))
      "
    />
    <v-container class="px-1 py-0" v-if="show3DProperties">
      <v-row v-if="visibleProperties.has('modelUrl')" no-gutters>
        <v-col>
          <VcsLabel html-for="vp-model-url">
            {{ $t('components.vectorProperties.modelUrl') }}
          </VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            id="vp-model-url"
            dense
            v-model="modelUrl"
            clearable
            :placeholder="'modelUrl' in value ? 'example.glb' : ''"
          />
        </v-col>
      </v-row>
      <v-row v-if="Object.keys(modelScale).length" no-gutters>
        <v-col cols="6">
          <VcsLabel>{{
            $t('components.vectorProperties.modelScale')
          }}</VcsLabel>
        </v-col>
        <v-col v-for="(dimension, key) in modelScale" :key="key">
          <VcsTextField
            dense
            v-model.number="dimension.value"
            type="number"
            :placeholder="`modelScale${key}` in value ? '1' : ''"
            :prefix="key"
            :rules="[(v) => v > 0 || 'components.validation.notValid']"
          />
        </v-col>
      </v-row>
      <v-row v-if="visibleProperties.has('modelHeading')" no-gutters>
        <v-col cols="6">
          <VcsLabel>{{
            $t('components.vectorProperties.modelHeading')
          }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            dense
            v-model.number="modelHeading"
            type="number"
            :placeholder="'modelHeading' in value ? '0 °' : ''"
            unit="°"
            clearable
          />
        </v-col>
      </v-row>
      <v-row v-if="visibleProperties.has('modelPitch')" no-gutters>
        <v-col cols="6">
          <VcsLabel>{{
            $t('components.vectorProperties.modelPitch')
          }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            dense
            v-model.number="modelPitch"
            type="number"
            :placeholder="'modelPitch' in value ? '0 °' : ''"
            unit="°"
            clearable
          />
        </v-col>
      </v-row>
      <v-row v-if="visibleProperties.has('modelRoll')" no-gutters>
        <v-col cols="6">
          <VcsLabel>{{ $t('components.vectorProperties.modelRoll') }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            dense
            v-model.number="modelRoll"
            type="number"
            :placeholder="'modelRoll' in value ? '0 °' : ''"
            unit="°"
            clearable
          />
        </v-col>
      </v-row>
      <v-row v-if="visibleProperties.has('baseUrl')" no-gutters>
        <v-col>
          <VcsLabel html-for="vp-base-url">{{
            $t('components.vectorProperties.baseUrl')
          }}</VcsLabel>
        </v-col>
        <v-col>
          <VcsTextField
            id="vp-base-url"
            dense
            clearable
            v-model="baseUrl"
            :placeholder="'baseUrl' in value ? 'path/to/files/' : ''"
          />
        </v-col>
      </v-row>
    </v-container>
  </VcsFormSection>
</template>

<script>
  import { computed } from 'vue';
  import { VContainer, VRow, VCol, VDivider } from 'vuetify/lib';
  import {
    VcsFormSection,
    VcsSelect,
    VcsTextField,
    VcsCheckbox,
    VcsLabel,
  } from '@vcmap/ui';
  import {
    usePrimitiveProperty,
    useArrayProperty,
    useHasProperty,
  } from './composables.js';
  import VcsChipArrayInput from '../form-inputs-controls/VcsChipArrayInput.vue';

  export const vectorProperties = [
    'altitudeMode',
    'allowPicking',
    'classificationType',
    'scaleByDistance',
    'eyeOffset',
    'heightAboveGround',
    'skirt',
    'groundLevel',
    'extrudedHeight',
    'storeysAboveGround',
    'storeysBelowGround',
    'storeyHeightsAboveGround',
    'storeyHeightsBelowGround',
    'modelUrl',
    'modelScaleX',
    'modelScaleY',
    'modelScaleZ',
    'modelHeading',
    'modelPitch',
    'modelRoll',
    'baseUrl',
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
   * @vue-prop {boolean} hideDividers - Wether the dividers, which group similar properties, should be hidden.
   * @vue-prop {string} [heading='Vector properties'] - Title of the form section, will be translated.
   * @vue-prop {boolean} [expandable=false] - If true, form section can be toggled.
   * @vue-prop {boolean} [startOpen=false] - If form section starts open.
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
      value: {
        type: Object,
        default: () => {},
      },
      valueDefault: {
        type: Object,
        required: true,
      },
      properties: {
        type: Array,
        default: () => vectorProperties,
      },
      show3DProperties: {
        type: Boolean,
        default: true,
      },
      hideDividers: {
        type: Boolean,
        default: false,
      },
    },
    setup(props, { emit }) {
      const visibleProperties = computed(() => {
        return new Set(props.properties);
      });

      const altitudeMode = usePrimitiveProperty(
        () => props.value,
        'altitudeMode',
        emit,
      );
      const heightAboveGround = usePrimitiveProperty(
        () => props.value,
        'heightAboveGround',
        emit,
      );
      const allowPicking = computed({
        get() {
          return props.value.allowPicking;
        },
        set(value) {
          if (props.value.allowPicking !== value) {
            const newParams = structuredClone(props.value);
            const changedParams = { allowPicking: value || false };
            emit('input', Object.assign(newParams, changedParams));
            emit('propertyChange', changedParams);
          }
        },
      });
      const classificationType = computed({
        get() {
          if ('classificationType' in props.value) {
            return props.value.classificationType || 'none';
          } else {
            return undefined;
          }
        },
        set(value) {
          if (props.value.classificationType !== value) {
            const newParams = structuredClone(props.value);
            const changedParams = {
              classificationType: value === 'none' ? undefined : value,
            };
            emit('input', Object.assign(newParams, changedParams));
            emit('propertyChange', changedParams);
          }
        },
      });
      const scaleByDistance = useArrayProperty(
        () => props.value,
        'scaleByDistance',
        emit,
        4,
      );
      const hasScaleByDistance = useHasProperty(
        () => props.value,
        'scaleByDistance',
        emit,
        scaleByDistanceDefault,
      );

      const eyeOffset = useArrayProperty(
        () => props.value,
        'eyeOffset',
        emit,
        3,
      );
      const hasEyeOffset = useHasProperty(
        () => props.value,
        'eyeOffset',
        emit,
        eyeOffsetDefault,
      );

      const groundLevel = usePrimitiveProperty(
        () => props.value,
        'groundLevel',
        emit,
      );
      const extrudedHeight = usePrimitiveProperty(
        () => props.value,
        'extrudedHeight',
        emit,
      );
      const skirt = usePrimitiveProperty(() => props.value, 'skirt', emit);
      const storeysAboveGround = usePrimitiveProperty(
        () => props.value,
        'storeysAboveGround',
        emit,
      );
      const storeysBelowGround = usePrimitiveProperty(
        () => props.value,
        'storeysBelowGround',
        emit,
      );

      const storeyHeights = computed(() => {
        return ['storeyHeightsAboveGround', 'storeyHeightsBelowGround']
          .filter((key) => visibleProperties.value.has(key))
          .reduce((acc, key) => {
            return {
              ...acc,
              [key]: computed({
                get() {
                  if (Array.isArray(props.value?.[key])) {
                    return props.value?.[key];
                  } else if (props.value?.[key] > 0) {
                    return [props.value?.[key]];
                  } else {
                    return [];
                  }
                },
                set(value) {
                  const newParams = structuredClone(props.value);
                  const changedParams = {
                    [key]: value,
                  };
                  emit('input', Object.assign(newParams, changedParams));
                  emit('propertyChange', changedParams);
                },
              }),
            };
          }, {});
      });

      const modelUrl = usePrimitiveProperty(
        () => props.value,
        'modelUrl',
        emit,
      );

      const modelScale = computed(() => {
        return dimensionsUpperCase
          .filter((dimension) =>
            visibleProperties.value.has(`modelScale${dimension}`),
          )
          .reduce((acc, dimension) => {
            return {
              ...acc,
              [dimension]: usePrimitiveProperty(
                () => props.value,
                `modelScale${dimension}`,
                emit,
              ),
            };
          }, {});
      });

      const modelHeading = usePrimitiveProperty(
        () => props.value,
        'modelHeading',
        emit,
      );
      const modelPitch = usePrimitiveProperty(
        () => props.value,
        'modelPitch',
        emit,
      );
      const modelRoll = usePrimitiveProperty(
        () => props.value,
        'modelRoll',
        emit,
      );
      const baseUrl = usePrimitiveProperty(() => props.value, 'baseUrl', emit);

      function reset() {
        const newParams = structuredClone(props.valueDefault);

        emit('input', newParams);
        emit('propertyChange', newParams);
      }

      return {
        visibleProperties,
        altitudeMode,
        heightAboveGround,
        allowPicking,
        classificationType,
        scaleByDistance,
        hasScaleByDistance,
        scaleByDistanceDefault,
        eyeOffset,
        hasEyeOffset,
        eyeOffsetDefault,
        groundLevel,
        extrudedHeight,
        skirt,
        storeysAboveGround,
        storeysBelowGround,
        storeyHeights,
        modelUrl,
        modelScale,
        modelHeading,
        modelPitch,
        modelRoll,
        baseUrl,
        reset,
        dimensionsUpperCase,
      };
    },
  };
</script>
