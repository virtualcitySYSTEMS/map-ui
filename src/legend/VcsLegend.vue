<template>
  <v-sheet class="overflow-y-auto">
    <v-expansion-panels
      variant="accordion"
      multiple
      v-if="entries.length > 0"
      class="rounded-0"
    >
      <v-expansion-panel
        v-for="(entry, i) in entries"
        :key="i"
        class="px-2"
        @group:selected="entry.open = !entry.open"
      >
        <v-expansion-panel-title hide-actions>
          <template #default="{ open }">
            <div class="d-flex justify-space-between">
              <div class="d-flex align-center">
                <v-icon class="mr-1" :class="{ rotate: !open }">
                  mdi-chevron-down
                </v-icon>
                {{ $st(entry.title) }}
              </div>
              <VcsActionButtonList :actions="entry.actions" />
            </div>
          </template>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="pl-6 pb-2">
          <v-list density="compact">
            <div v-for="(item, idx) in entry.legend" :key="idx">
              <div v-if="item.type === LegendType.Image">
                <img
                  :src="$st(item.src)"
                  :alt="item.src"
                  class="legend-image"
                  :title="item.tooltip"
                />
              </div>
              <div v-else-if="item.type === LegendType.Iframe">
                <iframe
                  :id="`legendIframe${idx}`"
                  :src="$st(item.src)"
                  scrolling="no"
                  style="width: 100%; height: 100%"
                  frameBorder="0"
                  @load="setIframeHeight(`legendIframe${idx}`)"
                />
              </div>
              <style-legend-item v-else :item="item" />
            </div>
          </v-list>
        </v-expansion-panel-text>
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
    VExpansionPanelText,
    VExpansionPanelTitle,
    VIcon,
    VList,
    VSheet,
  } from 'vuetify/components';
  import { computed } from 'vue';
  import { LegendType } from './legendHelper.js';
  import StyleLegendItem from './StyleLegendItem.vue';
  import VcsActionButtonList from '../components/buttons/VcsActionButtonList.vue';

  /**
   * @description A component rendering configured legend information for active layers.
   * @vue-prop {import("vue").UnwrapRef<Array<LegendEntry>>} entries - legend entries to be displayed
   * @vue-computed {import("vue").ComputedRef<number[]>} panels - derives indices from entries array to define all panels as open
   */
  export default {
    name: 'VcsLegend',
    components: {
      VcsActionButtonList,
      StyleLegendItem,
      VExpansionPanels,
      VExpansionPanel,
      VExpansionPanelText,
      VExpansionPanelTitle,
      VIcon,
      VList,
      VSheet,
    },
    props: {
      entries: {
        type: Array,
        default: () => [],
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
       * @type {import("vue").ComputedRef<number[]>}
       */
      const panels = computed({
        get() {
          return [...Array(props.entries.length).keys()].filter(
            (p, idx) => !!props.entries[idx].open,
          );
        },
        set() {},
      });

      return {
        LegendType,
        setIframeHeight,
        panels, // TODO
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
