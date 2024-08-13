<template>
  <v-sheet>
    <component
      v-for="key in styleComponents"
      :key="key"
      :is="componentMap[key]"
      :value-default="valueDefault[key]"
      v-bind="specificProps[key]"
      v-model="localValue[key]"
      @update:model-value="(v) => $emit(`update:${key}`, v)"
    />
  </v-sheet>
</template>

<script>
  import { computed } from 'vue';
  import { VSheet } from 'vuetify/components';
  import VcsFillMenu from './VcsFillMenu.vue';
  import VcsImageMenu from './VcsImageMenu.vue';
  import VcsStrokeMenu from './VcsStrokeMenu.vue';
  import VcsTextMenu from './VcsTextMenu.vue';
  import { useProxiedComplexModel } from '../modelHelper.js';

  /**
   * @enum {string}
   * @property {string} FILL
   * @property {string} STROKE
   * @property {string} IMAGE
   * @property {string} TEXT
   */
  export const VectorStyleMenus = {
    FILL: 'fill',
    STROKE: 'stroke',
    IMAGE: 'image',
    TEXT: 'text',
  };

  const componentMap = {
    fill: 'VcsFillMenu',
    stroke: 'VcsStrokeMenu',
    image: 'VcsImageMenu',
    text: 'VcsTextMenu',
  };

  /**
   * @description Wraps the style component into a single component so whole @vcmap/core/VectorStyleItemOptions can be modelled.
   * @vue-prop {import("@vcmap/core").VectorStyleItemOptions} [modelValue] - The VectorStyleItemOptions that should be modelled.
   * @vue-prop {import("@vcmap/core").VectorStyleItemOptions} [valueDefault] - The default VectorStyleItemOptions.
   * @vue-prop {VectorStyleMenus[]} [styleComponents] - The style component that should be rendered.
   * @vue-prop {boolean} [extendedShapeSettings=false] - If true, there are all the input fields needed to create arbitrary ol RegularShapes.
   * @vue-prop {Array<import("ol/style/Icon").Options>} [iconOptions] - The icon options in the image component too choose from. Scale and opacity are ignored. The defaults are 3 different icon types with 4 different colors.
   */
  export default {
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
        type: Object,
        default: undefined,
      },
      valueDefault: {
        type: Object,
        default: undefined,
      },
      styleComponents: {
        type: Array,
        default: () => Object.values(VectorStyleMenus),
        validator: (array) =>
          array.every((component) =>
            Object.values(VectorStyleMenus).includes(component),
          ),
      },
      extendedShapeSettings: {
        type: Boolean,
        default: false,
      },
      iconOptions: {
        type: Array,
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
      return {
        localValue,
        specificProps,
        componentMap,
      };
    },
  };
</script>
