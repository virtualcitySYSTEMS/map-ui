<template>
  <v-card>
    <span class="d-flex justify-space-between align-center ma-1">
      <v-icon
        class="mx-2"
      >
        $vcsSearch
      </v-icon>
      <VcsTextField
        class="font-size-14 d-inline-block user-select-none w-full mx-2"
        autofocus
        :loading="searching"
        clearable
        dense
        :placeholder="$t('search.placeholder')"
        v-model.trim="query"
        @keydown.enter="search"
        @keydown.esc="clear"
        @input="reset"
      />
    </span>
    <v-divider />
    <ResultsComponent :query="query" :results="results" />
  </v-card>
</template>

<style>

</style>

<script>
  import { inject, onUnmounted, ref } from 'vue';
  import { getLogger } from '@vcsuite/logger';
  import VcsTextField from '../components/form-inputs-controls/VcsTextField.vue';
  import ResultsComponent from './resultsComponent.vue';

  export default {
    components: { ResultsComponent, VcsTextField },
    setup() {
      /** @type {VcsUiApp} */
      const app = inject('vcsApp');
      const searching = ref(false);
      const query = ref(null);
      const suggestions = ref([]);
      const results = app.search.currentResults;

      const reset = () => {
        app.search.clearResults();
        suggestions.value = [];
      };

      const clear = () => {
        reset();
        searching.value = false;
        query.value = null;
      };

      const search = async () => {
        reset();
        searching.value = true;
        try {
          await app.search.search(query.value);
        } catch (e) {
          getLogger('Search').error(e);
        }
        searching.value = false;
      };

      onUnmounted(() => {
        clear();
      });

      return {
        query,
        searching,
        results,
        reset,
        clear,
        search,
      };
    },
  };
</script>
