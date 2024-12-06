<template>
  <v-sheet class="overflow-y-auto vcs-legend">
    <v-expansion-panels
      variant="accordion"
      multiple
      v-if="entries.length > 0"
      v-model="panels"
      class="rounded-0"
    >
      <vcs-expansion-panel
        v-for="(entry, i) in entries"
        :key="i"
        :value="entry.key"
        :heading="entry.title"
        :header-actions="entry.actions"
      >
        <v-list class="pl-6 pb-2">
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
                :id="`${cid}-legendIframe${idx}`"
                :src="$st(item.src)"
                scrolling="no"
                style="width: 100%; height: 100%"
                frameBorder="0"
                @load="setIframeHeight(`${cid}-legendIframe${idx}`)"
              />
            </div>
            <style-legend-item v-else :item="item" />
          </div>
        </v-list>
      </vcs-expansion-panel>
    </v-expansion-panels>
    <v-sheet v-else class="ma-2">
      {{ $t('legend.empty') }}
    </v-sheet>
  </v-sheet>
</template>

<script>
  import { VExpansionPanels, VList, VSheet } from 'vuetify/components';
  import { ref, watch } from 'vue';
  import { useComponentId } from '../components/composables.js';
  import { LegendType } from './legendHelper.js';
  import StyleLegendItem from './StyleLegendItem.vue';
  import VcsExpansionPanel from '../components/section/VcsExpansionPanel.vue';

  /**
   * @description A component rendering configured legend information for active layers.
   * @vue-prop {import("vue").UnwrapRef<Array<LegendEntry>>} entries - legend entries to be displayed
   * @vue-computed {import("vue").ComputedRef<number[]>} panels - derives indices from entries array to define all panels as open
   */
  export default {
    name: 'VcsLegend',
    components: {
      VcsExpansionPanel,
      StyleLegendItem,
      VExpansionPanels,
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

      let handledEntries = props.entries
        .filter((e) => e.open)
        .map((e) => e.key);
      /**
       * @type {import("vue").Ref<string[]>}
       */
      const panels = ref(handledEntries.slice());

      watch(props.entries, () => {
        props.entries.forEach((e) => {
          if (!handledEntries.includes(e.key)) {
            handledEntries.push(e.key);
            panels.value.push(e.key);
          }
        });
        handledEntries = handledEntries.filter((key) =>
          props.entries.find((e) => e.key === key),
        );
        panels.value = panels.value.filter((key) =>
          props.entries.find((e) => e.key === key),
        );
      });

      const cid = useComponentId();

      return {
        LegendType,
        setIframeHeight,
        panels,
        cid,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .legend-image {
    max-width: 100%;
    height: auto;
  }
</style>
