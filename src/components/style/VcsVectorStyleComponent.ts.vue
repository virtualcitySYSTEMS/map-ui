<script setup lang="ts">
  import { computed } from 'vue';
  import type { Component, PropType } from 'vue';
  import { VSheet } from 'vuetify/components';
  import type { ImageStyleOptions, VectorStyleItemOptions } from '@vcmap/core';
  import type { Options as IconOptions } from 'ol/style/Icon.js';
  import type { Options as FillOptions } from 'ol/style/Fill.js';
  import type { Options as StrokeOptions } from 'ol/style/Stroke.js';
  import VcsFillMenu from './VcsFillMenu.ts.vue';
  import VcsImageMenu from './VcsImageMenu.ts.vue';
  import VcsStrokeMenu from './VcsStrokeMenu.ts.vue';
  import VcsTextMenu from './VcsTextMenu.ts.vue';
  import { useProxiedComplexModel } from '../modelHelper.js';
  import { VectorStyleMenus, type TextStyleOptions } from './composables.js';

  /**
   * @description Wraps the style component into a single component so whole @vcmap/core/VectorStyleItemOptions can be modelled.
   * @vue-prop {import("@vcmap/core").VectorStyleItemOptions} [modelValue] - The VectorStyleItemOptions that should be modelled.
   * @vue-prop {import("@vcmap/core").VectorStyleItemOptions} [valueDefault] - The default VectorStyleItemOptions.
   * @vue-prop {VectorStyleMenus[]} [styleComponents] - The style component that should be rendered.
   * @vue-prop {boolean} [extendedShapeSettings=false] - If true, there are all the input fields needed to create arbitrary ol RegularShapes.
   * @vue-prop {Array<import("ol/style/Icon").Options>} [iconOptions] - The icon options in the image component too choose from. Scale and opacity are ignored. The defaults are 3 different icon types with 4 different colors.
   */

  const props = defineProps({
    modelValue: {
      type: Object as PropType<VectorStyleItemOptions>,
      default: () => ({}),
    },
    valueDefault: {
      type: Object as PropType<VectorStyleItemOptions>,
      default: undefined,
    },
    styleComponents: {
      type: Array as PropType<VectorStyleMenus[]>,
      default: () => Object.values(VectorStyleMenus),
      validator: (array: VectorStyleMenus[]) =>
        array.every((component) =>
          Object.values(VectorStyleMenus).includes(component),
        ),
    },
    extendedShapeSettings: {
      type: Boolean,
      default: false,
    },
    iconOptions: {
      type: Array as PropType<IconOptions[]>,
      default: undefined,
    },
  });
  const emit = defineEmits([
    'update:modelValue',
    ...Object.values(VectorStyleMenus).map((key) => `update:${key}`),
  ]);

  const componentMap: Record<VectorStyleMenus, Component> = {
    [VectorStyleMenus.FILL]: VcsFillMenu,
    [VectorStyleMenus.STROKE]: VcsStrokeMenu,
    [VectorStyleMenus.IMAGE]: VcsImageMenu,
    [VectorStyleMenus.TEXT]: VcsTextMenu,
  };

  const localValue = useProxiedComplexModel(props, 'modelValue', emit);
  const imageProps = computed(() => ({
    extendedShapeSettings: props.extendedShapeSettings,
    iconOptions: props.iconOptions,
  }));

  type ComponentModelValue =
    | FillOptions
    | StrokeOptions
    | ImageStyleOptions
    | TextStyleOptions
    | undefined;

  const getValueDefault = (key: VectorStyleMenus): ComponentModelValue => {
    const valueDefault = props.valueDefault?.[key];
    return (
      valueDefault === false ? undefined : valueDefault
    ) as ComponentModelValue;
  };

  function handleUpdate<K extends VectorStyleMenus>(
    key: K,
    value: VectorStyleItemOptions[K],
  ): void {
    localValue.value[key] = value;
    emit(`update:${key}`, value);
  }
</script>

<template>
  <v-sheet class="vcs-vector-style-component">
    <component
      v-for="key in styleComponents"
      :key="key"
      :is="componentMap[key]"
      :value-default="getValueDefault(key)"
      v-bind="key === VectorStyleMenus.IMAGE ? imageProps : undefined"
      :model-value="localValue[key as keyof VectorStyleItemOptions]"
      @update:model-value="handleUpdate(key, $event)"
    />
  </v-sheet>
</template>
