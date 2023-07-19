<template>
  <v-sheet>
    <component
      v-for="key in styleComponents"
      :key="key"
      :is="componentMap[key]"
      :value-default="valueDefault[key]"
      v-model="selectedKeys[key].value"
      @input="(value) => $emit(`update:${key}`, value)"
      v-bind="specificProps[key]"
    />
  </v-sheet>
</template>

<script>
  import { computed } from 'vue';
  import {
    VcsFillMenu,
    VcsImageMenu,
    VcsStrokeMenu,
    VcsTextMenu,
  } from '@vcmap/ui';
  import { VSheet } from 'vuetify/lib';
  import { useSelectedKey } from './composables.js';

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

  /**
   * @enum{string}
   */
  const componentMap = {
    fill: 'VcsFillMenu',
    stroke: 'VcsStrokeMenu',
    image: 'VcsImageMenu',
    text: 'VcsTextMenu',
  };

  /**
   * @description Wraps the style component into a single component so whole @vcmap/core/VectorStyleItemOptions can be modelled.
   * @vue-prop {import("@vcmap/core").VectorStyleItemOptions} value - The VectorStyleItemOptions that should be modelled.
   * @vue-prop {import("@vcmap/core").VectorStyleItemOptions} valueDefault - The default VectorStyleItemOptions.
   * @vue-prop {VectorStyleMenus[]} styleComponents - The style component that should be rendered.
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
      value: {
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
      const selectedKeys = computed(() =>
        // convert to Object with style prop names as keys and computed props as value to allow v-model.
        props.styleComponents.reduce((acc, key) => {
          acc[key] = useSelectedKey(
            () => props.value,
            key,
            props.valueDefault[key],
            emit,
          );
          return acc;
        }, {}),
      );
      const specificProps = computed(() => ({
        [VectorStyleMenus.IMAGE]: {
          extendedShapeSettings: props.extendedShapeSettings,
          iconOptions: props.iconOptions,
        },
      }));
      return {
        selectedKeys,
        specificProps,
        componentMap,
      };
    },
  };
</script>
