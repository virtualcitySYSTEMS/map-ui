<template>
  <v-sheet class="vcs-vector-style-component">
    <component
      v-for="key in styleComponents"
      :key="key"
      :is="componentMap[key as keyof typeof componentMap]"
      :value-default="valueDefault?.[key as keyof typeof valueDefault]"
      v-bind="specificProps[key as keyof typeof specificProps]"
      v-model="localValue[key]"
      @update:model-value="(v: unknown) => $emit(`update:${key}`, v)"
    />
  </v-sheet>
</template>

<script lang="ts">
  import { computed, defineComponent } from 'vue';
  import type { PropType } from 'vue';
  import { VSheet } from 'vuetify/components';
  import type { VectorStyleItemOptions } from '@vcmap/core';
  import type { Options as IconOptions } from 'ol/style/Icon.js';
  import VcsFillMenu from './VcsFillMenu.ts.vue';
  import VcsImageMenu from './VcsImageMenu.ts.vue';
  import VcsStrokeMenu from './VcsStrokeMenu.ts.vue';
  import VcsTextMenu from './VcsTextMenu.ts.vue';
  import { useProxiedComplexModel } from '../modelHelper.js';

  export enum VectorStyleMenus {
    FILL = 'fill',
    STROKE = 'stroke',
    IMAGE = 'image',
    TEXT = 'text',
  }

  const componentMap = {
    [VectorStyleMenus.FILL]: 'VcsFillMenu',
    [VectorStyleMenus.STROKE]: 'VcsStrokeMenu',
    [VectorStyleMenus.IMAGE]: 'VcsImageMenu',
    [VectorStyleMenus.TEXT]: 'VcsTextMenu',
  };

  /**
   * @description Wraps the style component into a single component so whole @vcmap/core/VectorStyleItemOptions can be modelled.
   * @vue-prop {import("@vcmap/core").VectorStyleItemOptions} [modelValue] - The VectorStyleItemOptions that should be modelled.
   * @vue-prop {import("@vcmap/core").VectorStyleItemOptions} [valueDefault] - The default VectorStyleItemOptions.
   * @vue-prop {VectorStyleMenus[]} [styleComponents] - The style component that should be rendered.
   * @vue-prop {boolean} [extendedShapeSettings=false] - If true, there are all the input fields needed to create arbitrary ol RegularShapes.
   * @vue-prop {Array<import("ol/style/Icon").Options>} [iconOptions] - The icon options in the image component too choose from. Scale and opacity are ignored. The defaults are 3 different icon types with 4 different colors.
   */
  export default defineComponent({
    name: 'VcsVectorStyleComponent',
    components: {
      VcsFillMenu,
      VcsImageMenu,
      VcsStrokeMenu,
      VcsTextMenu,
      VSheet,
    },
    props: {
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
    },
    setup(props, { emit }) {
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);
      const specificProps = computed(() => ({
        [VectorStyleMenus.IMAGE]: {
          extendedShapeSettings: props.extendedShapeSettings,
          iconOptions: props.iconOptions,
        },
      }));
      return { localValue, specificProps, componentMap };
    },
  });
</script>
