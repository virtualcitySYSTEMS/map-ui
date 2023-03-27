<template>
  <v-sheet v-if="items" class="pt-1 pb-0 px-2">
    <VcsSelect :items="items" v-model="currentStyle" />
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
          {{ entry.title }}
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-sheet>
</template>

<script>
  import { computed, inject, onUnmounted, ref } from 'vue';
  import {
    VChip, VList, VListItem, VListItemContent, VListItemIcon, VSheet,
  } from 'vuetify/lib';
  import VcsSelect from '../components/form-inputs-controls/VcsSelect.vue';

  export default {
    name: 'StyleSelector',
    components: {
      VcsSelect,
      VSheet,
      VList,
      VListItem,
      VListItemIcon,
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
    setup({ layerName, availableStyles }) {
      /** @type {VcsApp} */
      const app = inject('vcsApp');
      /** @type {import("@vcmap/core").FeatureLayer} */
      const layer = app.layers.getByKey(layerName);
      const currentStyleName = ref(layer.style.name);
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
      const styleChangedListener = layer.styleChanged.addEventListener(setStyle);
      onUnmounted(() => {
        styleChangedListener();
      });

      const currentStyle = computed({
        get() { return currentStyleName.value; },
        set(styleName) {
          const style = styleName === defaultStyle ?
            layer.defaultStyle :
            app.styles.getByKey(styleName);
          layer.setStyle(style);
        },
      });

      const items = computed(() => {
        return [
          { text: 'Default', value: defaultStyle },
          ...availableStyles.map(s => ({ text: s, value: s })),
        ];
      });

      return {
        currentStyle,
        currentStyleLegend,
        items,
      };
    },
  };
</script>

<style scoped>

</style>
