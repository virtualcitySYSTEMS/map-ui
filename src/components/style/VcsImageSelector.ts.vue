<script setup lang="ts">
  import type { PropType } from 'vue';
  import { computed, onMounted, ref, toRaw, watch } from 'vue';
  import {
    VSheet,
    VDivider,
    VContainer,
    VRow,
    VCol,
    VIcon,
    VTabs,
    VTab,
  } from 'vuetify/components';
  import type { ImageStyleOptions } from '@vcmap/core';
  import { useComponentId } from '../composables.js';
  import { useProxiedComplexModel } from '../modelHelper.js';
  import VcsLabel from '../form-inputs-controls/VcsLabel.ts.vue';
  import VcsTextField from '../form-inputs-controls/VcsTextField.ts.vue';
  import VcsSlider from '../form-inputs-controls/VcsSlider.ts.vue';
  import VcsRadio from '../form-inputs-controls/VcsRadio.ts.vue';
  import VcsFillMenu from './VcsFillMenu.ts.vue';
  import VcsStrokeMenu from './VcsStrokeMenu.ts.vue';
  import { between, defaultIcons, drawImageStyle } from './composables.js';

  /**
   * @description Allows to model a JSON representation of ol/style/Image style. It makes use of VcsStrokeMenu and VcsFillMenu.
   * @vue-prop {import("ol/style/RegularShape").Options | import("ol/style/Circle").Options | import("ol/style/Icon").Options} [modelValue] - The Image options
   * @vue-prop {import("ol/style/RegularShape").Options | import("ol/style/Circle").Options | import("ol/style/Icon").Options} [valueDefault] - The default image options
   * @vue-prop {Array<import("ol/style/Icon").Options>} [iconOptions] - The icon options too choose from. Scale and opacity are ignored. The defaults are 3 different shapes with 4 different colors.
   * @vue-prop {boolean} [extendedShapeSettings=false] - If true, there are all the input fields needed to create arbitrary ol RegularShapes.
   */

  enum ImageType {
    /** Regularshape or Circle */
    SHAPE = 'shape',
    /** Raster images */
    ICON = 'icon',
  }

  /**
   * Compares two regular shapes based on points, radius2, angle, rotation and scale.
   * @param shape1 A ol regular shape.
   * @param shape2 Another ol regular shape.
   * @returns Whether shapes are equal.
   */
  function isEqualShape(
    shape1: ImageStyleOptions,
    shape2: ImageStyleOptions,
  ): boolean {
    return (
      ((!shape1.points && !shape2.points) || shape1.points === shape2.points) &&
      shape1.radius2 === shape2.radius2 &&
      ((!shape1.angle && !shape2.angle) || shape1.angle === shape2.angle) &&
      ((!shape1.rotation && !shape2.rotation) ||
        shape1.rotation === shape2.rotation) &&
      ((!shape1.scale && !shape2.scale) ||
        (!shape1.scale && shape2.scale === 1) ||
        (shape1.scale === 1 && !shape2.scale) ||
        shape1.scale === shape2.scale ||
        (Array.isArray(shape1.scale) &&
          Array.isArray(shape2.scale) &&
          shape1.scale.every(
            (value, index) => value === (shape2.scale as number[])?.[index],
          )))
    );
  }

  /** Presets for different shapes with a matching mdi icon as src. */
  const defaultShapes: Array<{ src: string; value: ImageStyleOptions }> = [
    {
      src: 'mdi-circle-outline',
      value: { radius: 10 },
    },
    {
      src: 'mdi-square-outline',
      value: { points: 4, radius: 10, angle: Math.PI / 4 },
    },
    {
      src: 'mdi-rectangle-outline',
      value: {
        radius: 10 / Math.SQRT2,
        radius2: 10,
        points: 4,
        angle: 0,
        scale: [1, 0.5],
      },
    },
    {
      src: 'mdi-triangle-outline',
      value: { points: 3, radius: 10, angle: 0 },
    },
    {
      src: 'mdi-star-outline',
      value: { points: 5, radius: 10, radius2: 4, angle: 0 },
    },
    {
      src: 'mdi-plus',
      value: { points: 4, radius: 10, radius2: 0, angle: 0 },
    },
    {
      src: 'mdi-close',
      value: { points: 4, radius: 10, radius2: 0, angle: Math.PI / 4 },
    },
  ];

  const props = defineProps({
    modelValue: {
      type: Object as PropType<ImageStyleOptions>,
      default: () => ({}),
    },
    valueDefault: {
      type: Object as PropType<ImageStyleOptions>,
      default: undefined,
    },
    extendedShapeSettings: {
      type: Boolean,
      default: false,
    },
    iconOptions: {
      type: Array as PropType<ImageStyleOptions[]>,
      default: () => defaultIcons,
    },
  });
  const emit = defineEmits<{
    (e: 'update:modelValue', value: ImageStyleOptions): void;
  }>();

  const localValue = useProxiedComplexModel(props, 'modelValue', emit);
  const currentType = computed(() => {
    if (localValue.value?.radius) {
      return ImageType.SHAPE;
    } else if (localValue.value?.src) {
      return ImageType.ICON;
    } else {
      return undefined;
    }
  });

  const initialTab = Object.values(ImageType).findIndex(
    (type) => type === currentType.value,
  );

  const selectedImageTypeTab = ref(initialTab !== -1 ? initialTab : 0);

  const selectedType = computed(
    () => Object.values(ImageType)[selectedImageTypeTab.value],
  );

  const customIcon = 'mdi-dots-horizontal';

  const canvas = ref();

  const shapeSingleValueInputs = computed(() => {
    const inputs: {
      key: 'radius' | 'radius2' | 'points' | 'angle' | 'rotation';
      isRequired?: boolean;
      unit?: string;
      range?: number[];
      step?: number;
    }[] = [{ key: 'radius', unit: 'px', range: [1, 100], isRequired: true }];
    if (props.extendedShapeSettings) {
      inputs.push(
        { key: 'points', range: [0, 10] },
        { key: 'radius2', unit: 'px', range: [0, 100] },
        { key: 'angle', step: 0.1, unit: 'rad' },
        { key: 'rotation', step: 0.1, unit: 'rad' },
      );
    }
    return inputs;
  });

  const selectedScale = computed({
    get() {
      if (Array.isArray(localValue.value?.scale)) {
        return localValue.value.scale[0];
      } else {
        return localValue.value?.scale;
      }
    },
    set(value) {
      localValue.value.scale = value;
    },
  });

  const selectedIdx = ref(-1);

  watch(selectedType, () => {
    // unset selection on tab change
    if (currentType.value !== selectedType.value) {
      selectedIdx.value = -1;
    }
  });

  watch(
    localValue,
    () => {
      // derive selection on modelValue change
      if (currentType.value === ImageType.SHAPE) {
        const idx = defaultShapes
          .map(({ value }) => value)
          .findIndex((i) => isEqualShape(localValue.value, i));
        // select custom (index 7), if no defaultShape found
        selectedIdx.value = idx < 0 ? 7 : idx;
      } else if (currentType.value === ImageType.ICON) {
        selectedIdx.value = props.iconOptions.findIndex(
          (i) => i.src === localValue.value.src,
        );
      }
    },
    { deep: true },
  );

  watch(selectedIdx, (idx) => {
    // update modelValue on selection
    if (idx > -1) {
      if (
        selectedType.value === ImageType.SHAPE &&
        idx < defaultShapes.length
      ) {
        const switchFromICON = currentType.value === ImageType.ICON;
        localValue.value = {
          ...defaultShapes[idx]?.value,
          fill: switchFromICON
            ? props.valueDefault?.fill
            : toRaw(localValue.value?.fill),
          stroke: switchFromICON
            ? props.valueDefault?.stroke
            : toRaw(localValue.value?.stroke),
        };
      } else if (selectedType.value === ImageType.ICON) {
        localValue.value = {
          ...props.iconOptions[idx],
        };
      }
    }
  });

  const currentItems = computed(() => {
    let items: ImageStyleOptions[] = [];
    if (selectedType.value === ImageType.SHAPE) {
      items = [...defaultShapes];
      if (props.extendedShapeSettings) {
        items.push({ src: customIcon });
      }
    } else if (selectedType.value === ImageType.ICON) {
      items = props.iconOptions;
    }
    return items.map(({ src }, idx) => ({ src, idx }));
  });

  onMounted(async () => {
    await drawImageStyle(canvas.value, localValue.value);
    watch(
      localValue,
      async () => {
        await drawImageStyle(canvas.value, localValue.value);
      },
      { deep: true },
    );
  });

  const cid = useComponentId();
</script>

<template>
  <v-sheet class="vcs-image-selector">
    <v-container class="px-1 py-0">
      <v-row no-gutters>
        <v-col class="d-flex justify-center py-1">
          <canvas ref="canvas" width="50" height="50" />
        </v-col>
      </v-row>
    </v-container>
    <v-divider />
    <div class="px-1">
      <v-tabs v-model="selectedImageTypeTab" height="40" align-tabs="center">
        <v-tab
          v-for="item in Object.values(ImageType).map((value) => ({
            value,
            label: `components.style.${value}`,
          }))"
          :key="item.value"
          light
        >
          {{ $st(item.label) }}
        </v-tab>
      </v-tabs>
    </div>
    <v-divider />
    <v-container class="px-1 pt-1 pb-0">
      <VcsRadio
        v-model="selectedIdx"
        :items="currentItems"
        :disabled="!modelValue"
        item-value="idx"
        label-position="top"
        inline
        class="d-flex justify-center"
      >
        <template #label="{ item }">
          <img
            v-if="selectedType !== ImageType.SHAPE"
            :src="item.src"
            alt="shape"
          />
          <v-icon v-else size="24">{{ item.src }}</v-icon>
        </template>
      </VcsRadio>
      <div v-if="selectedType === ImageType.ICON">
        <v-row no-gutters>
          <v-col>
            <VcsLabel :html-for="`${cid}-style-icon-opacity`">
              {{ $st('components.style.opacity') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSlider
              :id="`${cid}-style-icon-opacity`"
              v-model="localValue.opacity"
              step="0.1"
              type="number"
              max="1"
              min="0"
              :disabled="currentType !== ImageType.ICON"
            />
          </v-col>
        </v-row>
      </div>
      <div v-else-if="selectedType === ImageType.SHAPE">
        <v-row
          no-gutters
          v-for="input in shapeSingleValueInputs"
          :key="input.key"
        >
          <v-col>
            <VcsLabel :html-for="`${cid}-${input.key}`">{{
              $st(`components.style.${input.key}`)
            }}</VcsLabel>
          </v-col>
          <v-col cols="3">
            <VcsTextField
              :id="`${cid}-${input.key}`"
              :hide-spin-buttons="true"
              type="number"
              :unit="input.unit || ''"
              v-model.number="localValue[input.key]"
              :disabled="currentType !== ImageType.SHAPE"
              :step="input.step || 1"
              :min="input.range?.[0] || 0"
              :max="input.range?.[1] || undefined"
              :rules="[
                (v: number) =>
                  !input.isRequired || !!v || 'components.validation.required',
                (v: number) =>
                  !input.range ||
                  (!input.isRequired && !v) ||
                  between(v, input.range as [number, number]) ||
                  `${$st(
                    'components.validation.allowedRange',
                  )}: ${input.range.join(' - ')}`,
              ]"
            />
          </v-col>
        </v-row>
      </div>
      <v-row
        no-gutters
        v-if="extendedShapeSettings || selectedType === ImageType.ICON"
      >
        <v-col>
          <VcsLabel :html-for="`${cid}-style-shape-scale`">
            {{ $st('components.style.scale') }}
          </VcsLabel>
        </v-col>
        <v-col cols="3">
          <VcsTextField
            :id="`${cid}-style-shape-scale`"
            :hide-spin-buttons="true"
            type="number"
            v-model.number="selectedScale"
            placeholder="1"
            :disabled="currentType !== selectedType"
            :rules="[
              (v: number) => !v || v > 0 || 'components.validation.notValid',
            ]"
          />
        </v-col>
      </v-row>
      <VcsStrokeMenu
        v-if="selectedType === ImageType.SHAPE"
        v-model="localValue.stroke"
        :value-default="valueDefault?.stroke"
        :disabled="!localValue || currentType !== ImageType.SHAPE"
      />
      <VcsFillMenu
        v-if="selectedType === ImageType.SHAPE"
        v-model="localValue.fill"
        :value-default="valueDefault?.fill"
        :disabled="!localValue || currentType !== ImageType.SHAPE"
      />
    </v-container>
  </v-sheet>
</template>
