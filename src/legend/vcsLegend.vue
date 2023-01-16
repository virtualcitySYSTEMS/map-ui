<template>
  <v-card
    class="overflow-y-auto"
    max-height="500"
  >
    <v-expansion-panels
      accordion
      multiple
    >
      <v-expansion-panel
        v-for="(entry,i) in entries"
        :key="i"
        class="pa-0 ma-0"
      >
        <v-expansion-panel-header hide-actions>
          {{ $t(entry.title) }}
          <template #default="{ open }">
            <div class="d-flex">
              <v-icon :class="{ 'v-treeview-node__toggle': !open }">
                mdi-chevron-down
              </v-icon>
              <VcsTreeviewLeaf class="w-full" :item="entry" />
            </div>
          </template>
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-list dense>
            <div v-for="(item, idx) in entry.legend" :key="idx">
              <div v-if="item.type === LegendType.Image" class="mx-2">
                <img
                  :src="$t(item.src)"
                  max-width="287"
                  max-height="auto"
                  class="mx-2 legend-image"
                  :title="item.tooltip"
                >
              </div>
              <div v-else-if="item.type === LegendType.Iframe" class="mx-2">
                <iframe
                  :id="`legendIframe${idx}`"
                  :src="$t(item.src)"
                  scrolling="no"
                  width="287"
                  frameBorder="0"
                  @load="setIframeHeight(`legendIframe${idx}`)"
                />
              </div>
              <style-legend-item v-else :item="item" class="mx-2" />
            </div>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-card>
</template>

<script>

  import {
    VCard,
    VExpansionPanels,
    VExpansionPanel,
    VExpansionPanelHeader,
    VExpansionPanelContent,
    VIcon,
    VList,
  } from 'vuetify/lib';
  import { LegendType } from './legendHelper.js';
  import StyleLegendItem from './styleLegendItem.vue';
  import VcsTreeviewLeaf from '../components/lists/VcsTreeviewLeaf.vue';

  /**
   * @description A component rendering configured legend information for active layers.
   * @vue-prop {import("vue").Ref<Array<LegendEntry>>} entries - legend entries to be displayed
   */
  export default {
    name: 'VcsLegend',
    components: {
      VcsTreeviewLeaf,
      StyleLegendItem,
      VCard,
      VExpansionPanels,
      VExpansionPanel,
      VExpansionPanelHeader,
      VExpansionPanelContent,
      VIcon,
      VList,
    },
    props: {
      entries: {
        type: Object,
        required: true,
      },
    },
    setup() {
      /**
       * adapts the iframe height on load
       * @param {string} id - iframe's html id
       */
      const setIframeHeight = (id) => {
        const iframe = document.getElementById(id);
        iframe.style.height = `${iframe.contentWindow.document.documentElement.scrollHeight}px`;
      };

      return {
        LegendType,
        setIframeHeight,
      };
    },
  };
</script>

<style lang="scss" scoped>
.v-list-item--dense {
  height: 32px;
}
::v-deep {
  .treeview-label {
    max-width: 189px;
  }
}
.legend-image {
  max-width: 287px;
  height: auto;
  width: auto;
}
</style>
