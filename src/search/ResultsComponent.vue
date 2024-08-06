<template>
  <v-list
    class="ma-0 overflow-y-auto vcs-search-results"
    v-model:selected="highlighted"
  >
    <ResultItem
      :item="item"
      :query="query"
      class="cursor-pointer"
      :class="{ 'vcs-search-result-border': index < items.length - 1 }"
      v-for="(item, index) in items"
      :key="index"
      :value="item.value"
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
   * @vue-prop {Array<import("./search.js").ResultItem>} results - Array of results.
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
      const items = computed(() => {
        return props.results.map((item, index) => ({
          ...item,
          value: index,
        }));
      });
      const selectedRef = ref([]);
      /** @type {import("@src/vcsUiApp.js").default} */
      const app = inject('vcsApp');
      const selectedListener = app.featureInfo.featureChanged.addEventListener(
        (feature) => {
          if (selectedRef.value.length > 0) {
            const [index] = selectedRef.value;
            if (feature && items.value[index].feature === feature) {
              return;
            }
            selectedRef.value = [];
          } else if (feature) {
            selectedRef.value = [
              items.value.findIndex((r) => r.feature === feature),
            ];
          }
        },
      );

      onUnmounted(() => {
        selectedListener();
      });

      return {
        items,
        highlighted: computed({
          get() {
            return selectedRef.value;
          },
          set(value) {
            selectedRef.value = value;
            const [index] = value;
            if (index >= 0) {
              const item = items.value[index];
              item.clicked();
            }
          },
        }),
      };
    },
  };
</script>

<style lang="scss" scoped>
  .vcs-search-results {
    max-height: 400px;
  }
  .vcs-search-result-border {
    border-bottom: thin solid;
    border-color: rgb(var(--v-theme-base-lighten-2));
  }
</style>
