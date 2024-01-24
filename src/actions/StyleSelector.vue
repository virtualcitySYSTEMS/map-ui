<template>
  <v-sheet v-if="items" class="pt-1 pb-0 px-0">
    <v-list>
      <v-list-item
        v-for="(item, index) in items"
        :key="index"
        @click.stop="select(item.value)"
      >
        <v-list-item-title
          :class="{ 'primary--text': item.value === currentStyleName }"
        >
          {{ $t(item.text) }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
    <v-list v-if="currentStyleLegend.length > 0">
      <v-list-item
        v-for="(entry, index) in currentStyleLegend"
        :key="`style-legend-${index}`"
        dense
      >
        <v-list-item-icon>
          <v-chip :color="entry.color" />
        </v-list-item-icon>
        <v-list-item-content>
          {{ $t(entry.title) }}
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-sheet>
</template>

<script>
  import { computed, inject, onUnmounted, ref } from 'vue';
  import {
    VChip,
    VList,
    VListItem,
    VListItemContent,
    VListItemIcon,
    VListItemTitle,
    VSheet,
  } from 'vuetify/lib';

  /**
   * @description Modal listing available styles.
   * On selection style is set to provided layer.
   * @vue-prop {Array<string>} availableStyles - Name of available styles
   * @vue-prop {string} layerName              - Name of a layer, the style shall be applied to on selection
   */
  export default {
    name: 'StyleSelector',
    components: {
      VSheet,
      VList,
      VListItem,
      VListItemIcon,
      VListItemTitle,
      VChip,
      VListItemContent,
    },
    props: {
      availableStyles: {
        type: Array,
        default: () => [],
      },
      layerName: {
        type: String,
        required: true,
      },
    },
    setup(props, { attrs }) {
      /** @type {import("@src/vcsUiApp.js").default} */
      const app = inject('vcsApp');
      /** @type {import("@vcmap/core").FeatureLayer} */
      const layer = app.layers.getByKey(props.layerName);
      const currentStyleName = ref(layer.style.name || layer.defaultStyle.name);
      const currentStyleLegend = ref([]);
      const defaultStyle = layer.defaultStyle.name;

      function setStyle(styleItem) {
        currentStyleName.value = layer.style.name;
        if (styleItem.legend) {
          currentStyleLegend.value = styleItem.legend;
        }
      }
      setStyle(layer.style);
      // TODO error handling if layer is missing or not a feature layer
      const styleChangedListener =
        layer.styleChanged.addEventListener(setStyle);
      onUnmounted(() => {
        styleChangedListener();
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
        const style = app.styles.hasKey(styleName)
          ? app.styles.getByKey(styleName)
          : layer.defaultStyle;
        layer.setStyle(style);
        app.windowManager.remove(attrs['window-state'].id);
      }

      return {
        currentStyleName,
        currentStyleLegend,
        items,
        select,
      };
    },
  };
</script>

<style scoped></style>
