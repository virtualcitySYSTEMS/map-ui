<template>
  <v-sheet v-if="items" class="pt-1 pb-0 px-0">
    <v-list>
      <v-list-item
        v-for="(item, index) in items"
        :key="index"
        @click.stop="select(item.value)"
      >
        <v-list-item-title
          :class="{ 'text-primary': item.value === currentStyleName }"
        >
          {{ $st(item.text) }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-sheet>
</template>

<script>
  import { computed, inject, onUnmounted, ref } from 'vue';
  import { VList, VListItem, VListItemTitle, VSheet } from 'vuetify/components';
  import { FeatureLayer } from '@vcmap/core';

  /**
   * @description Modal listing available styles.
   * On selection style is set to provided layer.
   * @vue-prop {Array<string>} availableStyles - Name of available styles
   * @vue-prop {Array<string>} layerNames      - Name of layers, the style shall be applied to on selection
   */
  export default {
    name: 'StyleSelector',
    components: {
      VSheet,
      VList,
      VListItem,
      VListItemTitle,
    },
    props: {
      availableStyles: {
        type: Array,
        default: () => [],
      },
      layerNames: {
        type: Array,
        required: true,
      },
    },
    setup(props, { attrs }) {
      /** @type {import("@src/vcsUiApp.js").default} */
      const app = inject('vcsApp');
      /** @type {import("@vcmap/core").FeatureLayer[]} */
      const layers = props.layerNames
        .map((name) => app.layers.getByKey(name))
        .filter((layer) => layer instanceof FeatureLayer);

      const currentStyleName = ref();
      const setCurrentStyle = () => {
        let styleName = null;
        layers.forEach((layer) => {
          const layerStyle = layer?.style?.name || layer?.defaultStyle?.name;
          if (styleName === null) {
            styleName = layerStyle;
          }
          if (styleName !== layerStyle) {
            styleName = '';
          }
        });
        currentStyleName.value = styleName;
      };

      setCurrentStyle();
      const defaultStyle =
        layers.length === 1 ? layers[0]?.defaultStyle?.name : null;

      const styleChangedListener = layers.map((layer) =>
        layer.styleChanged.addEventListener(setCurrentStyle),
      );
      onUnmounted(() => {
        styleChangedListener.forEach((cb) => cb());
      });

      const items = computed(() => {
        const styles = props.availableStyles
          .filter((name) => app.styles.hasKey(name))
          .map((name) => ({
            text: app.styles.getByKey(name)?.properties?.title || name,
            value: name,
          }));
        if (defaultStyle && props.availableStyles.indexOf(defaultStyle) < 0) {
          return [
            {
              text: 'Default',
              value: defaultStyle,
            },
            ...styles,
          ];
        }
        return styles.sort((a) => {
          if (a === defaultStyle) {
            return -1;
          }
          return 0;
        });
      });

      function select(styleName) {
        const style = app.styles.getByKey(styleName);
        layers.forEach((layer) => {
          layer.setStyle(style || layer.defaultStyle);
        });
        app.windowManager.remove(attrs['window-state'].id);
      }

      return {
        currentStyleName,
        items,
        select,
      };
    },
  };
</script>

<style scoped></style>
