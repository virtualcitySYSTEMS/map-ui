<template>
  <v-list dense class="ma-0 overflow-y-auto vcs-search-results">
    <v-list-item-group
      v-model="highlighted"
    >
      <v-list-item
        v-for="(item, index) in results"
        :key="index"
        color="secondary"
        class="px-0"
      >
        <v-list-item-content>
          <ResultItem
            :item="item"
            :query="query"
            class="cursor-pointer"
          />
          <v-divider
            v-if="index < results.length - 1"
            :key="index"
          />
        </v-list-item-content>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<script>
  import { inject, onUnmounted, ref, computed } from 'vue';
  import ResultItem from './resultItem.vue';

  /**
   * ResultsComponent listing all available result items in a scrollable list
   * @vue-prop {string} query - The query string forwarded to mark results within resultItem component.
   * @vue-prop {Array<ResultItem>} results - Array of results.
   * @vue-computed {import("vue").Ref<string>} highlighted - The highlighted result item. Updates also on feature select.
   */
  export default {
    name: 'ResultsComponent',
    components: { ResultItem },
    props: {
      query: {
        type: String,
        default: '',
      },
      results: {
        type: Array,
        required: true,
      },
    },
    setup(props) {
      const highlightedRef = ref(-1);
      /** @type {VcsUiApp} */
      const app = inject('vcsApp');
      const selectedListener = app.featureInfo.featureChanged.addEventListener((feature) => {
        if (highlightedRef.value >= 0) {
          if (feature && props.results[highlightedRef.value].feature === feature) {
            return;
          }
          highlightedRef.value = -1;
        } else if (feature) {
          highlightedRef.value = props.results.findIndex(r => r.feature === feature);
        }
      });

      onUnmounted(() => {
        selectedListener();
      });

      return {
        highlighted: computed({
          get() { return highlightedRef.value; },
          set(value) {
            highlightedRef.value = value;
            if (value >= 0) {
              const item = props.results[value];
              item.clicked();
            }
          },
        }),
      };
    },
  };
</script>

<style scoped>
  .vcs-search-results {
    max-height: 400px;
  }
</style>
