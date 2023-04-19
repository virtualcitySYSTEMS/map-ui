<template>
  <v-sheet class="overflow-y-auto">
    <v-expansion-panels
      accordion
      multiple
      v-if="entries.length > 0"
      v-model="panels"
      class="rounded-0"
    >
      <v-expansion-panel
        v-for="(entry, i) in entries"
        :key="i"
        class="px-2"
        @change="entry.open = !entry.open"
      >
        <v-expansion-panel-header hide-actions>
          <template #default="{ open }">
            <div class="d-flex justify-space-between">
              <div class="d-flex align-center">
                <v-icon class="mr-1" :class="{ rotate: !open }">
                  mdi-chevron-down
                </v-icon>
                {{ $t(entry.title) }}
              </div>
              <VcsActionButtonList small :actions="entry.actions" />
            </div>
          </template>
        </v-expansion-panel-header>
        <v-expansion-panel-content class="pl-6 pb-2">
          <v-list dense>
            <div v-for="(item, idx) in entry.legend" :key="idx">
              <div v-if="item.type === LegendType.Image">
                <img
                  :src="$t(item.src)"
                  class="legend-image"
                  :title="item.tooltip"
                />
              </div>
              <div v-else-if="item.type === LegendType.Iframe">
                <iframe
                  :id="`legendIframe${idx}`"
                  :src="$t(item.src)"
                  scrolling="no"
                  style="width: 100%; height: 100%"
                  frameBorder="0"
                  @load="setIframeHeight(`legendIframe${idx}`)"
                />
              </div>
              <style-legend-item v-else :item="item" />
            </div>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
    <v-sheet v-else class="ma-2">
      {{ $t('legend.empty') }}
    </v-sheet>
  </v-sheet>
</template>

<script>
  import {
    VExpansionPanels,
    VExpansionPanel,
    VExpansionPanelHeader,
    VExpansionPanelContent,
    VIcon,
    VList,
    VSheet,
  } from 'vuetify/lib';
  import { computed } from 'vue';
  import { LegendType } from './legendHelper.js';
  import StyleLegendItem from './styleLegendItem.vue';
  import VcsActionButtonList from '../components/buttons/VcsActionButtonList.vue';

  /**
   * @description A component rendering configured legend information for active layers.
   * @vue-prop {import("vue").Ref<Array<LegendEntry>>} entries - legend entries to be displayed
   * @vue-computed {import("vue").ComputedRef<number[]>} panels - derives indices from entries array to define all panels as open
   */
  export default {
    name: 'VcsLegend',
    components: {
      VcsActionButtonList,
      StyleLegendItem,
      VExpansionPanels,
      VExpansionPanel,
      VExpansionPanelHeader,
      VExpansionPanelContent,
      VIcon,
      VList,
      VSheet,
    },
    props: {
      entries: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      /**
       * adapts the iframe height on load
       * @param {string} id - iframe's html id
       */
      const setIframeHeight = (id) => {
        const iframe = document.getElementById(id);
        iframe.style.height = `${iframe.contentWindow.document.documentElement.scrollHeight}px`;
      };

      /**
       * Sets all entry panels open
       * @type {import("vue").ComputedRef<number[]>}
       */
      const panels = computed(() => {
        return [...Array(props.entries.length).keys()].filter(
          (p, idx) => !!props.entries[idx].open,
        );
      });

      return {
        LegendType,
        setIframeHeight,
        panels,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .legend-image {
    max-width: 100%;
    height: auto;
  }
  .rotate {
    transform: rotate(-90deg);
  }
</style>
