<template>
  <v-list
    class="ma-0 overflow-y-auto results-component"
    :class="xs ? 'vcs-search-results-mobile' : 'vcs-search-results'"
    v-model:selected="highlighted"
  >
    <ResultItem
      :item="item"
      :query="query"
      class="cursor-pointer"
      :class="{
        'vcs-search-result-border': index < renderingItems.length - 1,
        selected: index === selectedIndex,
      }"
      v-for="(item, index) in renderingItems"
      :key="index"
      :value="item.value"
    />
  </v-list>
</template>

<script>
  import { inject, onUnmounted, ref, computed } from 'vue';
  import { VList } from 'vuetify/components';
  import { useDisplay } from 'vuetify';
  import { getLogger } from '@vcsuite/logger';
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
      selectedIndex: {
        type: Number,
        default: -1,
      },
      showSelectedOnly: {
        type: Boolean,
        default: false,
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

      const { xs } = useDisplay();

      const highlighted = computed({
        get() {
          return selectedRef.value;
        },
        set(value) {
          selectedRef.value = value;
          const [index] = value;
          if (index >= 0) {
            const item = items.value[index];
            const p = item.clicked();
            if (p instanceof Promise) {
              p.catch((e) => {
                getLogger('ResultComponent.vue').error(
                  'Result item failed on click',
                  e,
                );
              });
            }
          }
        },
      });

      onUnmounted(() => {
        selectedListener();
      });

      // Dynamically filter items based on showSelectedOnly
      const renderingItems = computed(() => {
        if (props.showSelectedOnly) {
          const index = selectedRef.value[0];
          if (index !== undefined && index !== null) {
            return [items.value[index]];
          } else {
            return [];
          }
        }
        return items.value;
      });

      return {
        renderingItems,
        highlighted,
        xs,
      };
    },
  };
</script>

<style lang="scss" scoped>
  .vcs-search-results {
    max-height: 400px;
  }
  .vcs-search-results-mobile {
    max-height: 300px;
  }
  .vcs-search-result-border {
    border-bottom: thin solid;
    border-color: rgb(var(--v-theme-base-lighten-2));
  }
  .selected {
    background-color: rgb(var(--v-theme-base-lighten-4));
  }
</style>
