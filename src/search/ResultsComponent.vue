<template>
  <v-list
    density="compact"
    class="ma-0 overflow-y-auto vcs-search-results"
    v-model="highlighted"
  >
    <ResultItem
      :item="item"
      :query="query"
      class="cursor-pointer px-0"
      v-for="(item, index) in results"
      :key="index"
    />
  </v-list>
</template>

<script>
  import { inject, onUnmounted, ref, computed } from 'vue';
  import { VList } from 'vuetify/components';
  import ResultItem from './ResultItem.vue';

  /**
   * @description ResultsComponent listing all available result items in a scrollable list
   * @vue-prop {string} query - The query string forwarded to mark results within resultItem component.
   * @vue-prop {Array<ResultItem>} results - Array of results.
   * @vue-computed {import("vue").Ref<string>} highlighted - The highlighted result item. Updates also on feature select.
   */
  export default {
    name: 'ResultsComponent',
    components: {
      ResultItem,
      VList,
    },
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
      /** @type {import("@src/vcsUiApp.js").default} */
      const app = inject('vcsApp');
      const selectedListener = app.featureInfo.featureChanged.addEventListener(
        (feature) => {
          if (highlightedRef.value >= 0) {
            if (
              feature &&
              props.results[highlightedRef.value].feature === feature
            ) {
              return;
            }
            highlightedRef.value = -1;
          } else if (feature) {
            highlightedRef.value = props.results.findIndex(
              (r) => r.feature === feature,
            );
          }
        },
      );

      onUnmounted(() => {
        selectedListener();
      });

      return {
        highlighted: computed({
          get() {
            return highlightedRef.value;
          },
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
