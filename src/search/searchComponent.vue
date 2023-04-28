<template>
  <v-sheet>
    <span class="d-flex justify-space-between align-center mt-1 ml-2">
      <v-icon class="pa-1"> $vcsSearch </v-icon>
      <VcsTextField
        class="d-inline-block user-select-none w-full mx-1"
        autofocus
        :loading="searching"
        clearable
        dense
        :placeholder="$t('search.placeholder')"
        v-model.trim="query"
        @keydown.enter="search"
        @input="reset"
      />
    </span>
    <v-divider class="mt-1 base darken-1" v-if="!!results.length" />
    <ResultsComponent :query="query" :results="results" />
    <v-divider v-if="!!results.length" />
    <VcsButton
      v-if="!!results.length"
      class="d-flex pt-1 px-1 justify-end"
      @click="zoomToAll"
    >
      {{ $t('search.zoomToAll') }}
    </VcsButton>
  </v-sheet>
</template>

<style lang="scss" scoped>
  ::v-deep {
    .v-input {
      fieldset {
        padding: 0 !important;
      }
      fieldset,
      input {
        border-color: transparent !important;
      }
    }
    .v-icon .v-icon__component {
      width: 16px;
      height: 16px;
    }
  }
</style>

<script>
  import { inject, onUnmounted, ref } from 'vue';
  import { getLogger } from '@vcsuite/logger';
  import { VSheet, VDivider, VIcon } from 'vuetify/lib';
  import VcsTextField from '../components/form-inputs-controls/VcsTextField.vue';
  import ResultsComponent from './resultsComponent.vue';
  import VcsButton from '../components/buttons/VcsButton.vue';

  export default {
    components: {
      VcsButton,
      ResultsComponent,
      VcsTextField,
      VSheet,
      VIcon,
      VDivider,
    },
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

      const zoomToAll = () => {
        app.search.zoomToAll();
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
        zoomToAll,
      };
    },
  };
</script>
