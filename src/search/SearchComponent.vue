<template>
  <v-sheet>
    <span class="d-flex justify-space-between align-center mt-1 ml-2">
      <v-icon class="pa-1"> $vcsSearch </v-icon>
      <VcsTextField
        class="d-inline-block user-select-none w-100 mx-1"
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
    <v-divider class="mt-1 base-darken-1" v-if="!!results.length" />
    <ResultsComponent :query="query" :results="results" />
    <v-divider v-if="!!results.length" />
    <div v-if="!!results.length" class="d-flex px-2 pt-2 pb-1 justify-end">
      <VcsFormButton @click="zoomToAll" variant="outlined">
        {{ $t('search.zoomToAll') }}
      </VcsFormButton>
    </div>
  </v-sheet>
</template>

<style lang="scss" scoped>
  :deep(.v-input) {
    fieldset {
      padding: 0 !important;
    }
    fieldset,
    input {
      border-color: transparent !important;
    }
  }
  :deep(.v-icon .v-icon__component) {
    width: 16px;
    height: 16px;
  }
  .user-select-none {
    user-select: none;
  }
</style>

<script>
  import { inject, onUnmounted, ref } from 'vue';
  import { getLogger } from '@vcsuite/logger';
  import { VSheet, VDivider, VIcon } from 'vuetify/components';
  import VcsTextField from '../components/form-inputs-controls/VcsTextField.vue';
  import ResultsComponent from './ResultsComponent.vue';
  import VcsFormButton from '../components/buttons/VcsFormButton.vue';

  /**
   * @description Stylized search component providing an input field for search inputs.
   * Renders a list of results using {@link ResultsComponent }
   */
  export default {
    components: {
      VcsFormButton,
      ResultsComponent,
      VcsTextField,
      VSheet,
      VIcon,
      VDivider,
    },
    setup() {
      /** @type {import("@src/vcsUiApp.js").default} */
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
