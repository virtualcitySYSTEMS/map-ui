<template>
  <v-sheet>
    <span class="d-flex justify-space-between align-center mt-1 ml-2">
      <v-icon class="pa-1" :size="searchIconSize"> $vcsSearch </v-icon>
      <VcsTextField
        class="d-inline-block user-select-none w-100 mx-1"
        autofocus
        :loading="searching"
        clearable
        :placeholder="$t('search.placeholder')"
        v-model.trim="query"
        @keydown.enter="search"
        @input="reset"
        @click:clear="reset"
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
  :deep(.v-field .v-field__outline *) {
    border-color: transparent !important;
  }
  .user-select-none {
    user-select: none;
  }
</style>

<script>
  import { inject, onUnmounted, ref, computed } from 'vue';
  import { getLogger } from '@vcsuite/logger';
  import { VSheet, VDivider, VIcon } from 'vuetify/components';
  import VcsTextField from '../components/form-inputs-controls/VcsTextField.vue';
  import ResultsComponent from './ResultsComponent.vue';
  import VcsFormButton from '../components/buttons/VcsFormButton.vue';
  import { useFontSize } from '../vuePlugins/vuetify.js';

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

      const fontSize = useFontSize();
      const searchIconSize = computed(() => {
        return fontSize.value + 11;
      });
      return {
        query,
        searching,
        results,
        reset,
        clear,
        search,
        zoomToAll,
        searchIconSize,
      };
    },
  };
</script>
