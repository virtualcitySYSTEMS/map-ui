<template>
  <v-sheet>
    <span
      class="d-flex justify-space-between align-center ml-2 search-component"
      :class="xs ? 'mobile-style' : 'mt-1'"
    >
      <v-icon class="pa-1" :size="searchIconSize"> $vcsSearch </v-icon>
      <VcsTextField
        class="d-inline-block user-select-none w-100 mx-1"
        autofocus
        :loading="searching"
        clearable
        :placeholder="$t('search.placeholder')"
        v-model="query"
        @keydown.enter.prevent="search"
        @keydown.down.stop.prevent="selectSuggestion(1)"
        @keydown.up.stop.prevent="selectSuggestion(-1)"
        @input="onInput"
        @click:clear="reset"
      />
    </span>
    <template v-if="results.length > 0">
      <v-divider class="mt-1 base-darken-1" />
      <ResultsComponent
        :query="query"
        :results="results"
        :show-selected-only="showSelectedOnly"
      />
      <v-divider />

      <v-row no-gutters>
        <v-col>
          <div class="button-container d-flex align-center px-2 pt-2 pb-1">
            <VcsFormButton
              class="fixed-button"
              @click="showSelectedOnly = !showSelectedOnly"
            >
              <v-icon icon="mdi-arrow-collapse-vertical" />
            </VcsFormButton>
            <VcsFormButton
              @click="zoomToAll"
              class="ellipsis-button"
              variant="outlined"
            >
              {{ xs ? $t('search.zoomToAllMobile') : $t('search.zoomToAll') }}
            </VcsFormButton>
          </div></v-col
        ></v-row
      >
    </template>
    <template v-else-if="suggestions.length > 0">
      <v-divider class="mt-1 base-darken-1" />
      <ResultsComponent
        class="suggestions"
        :results="suggestions"
        :query="query"
        :selected-index="selectedSuggestion"
      />
    </template>
  </v-sheet>
</template>

<script>
  import { inject, ref, computed } from 'vue';
  import { getLogger } from '@vcsuite/logger';
  import { v4 as uuid } from 'uuid';
  import { VSheet, VDivider, VIcon, VRow, VCol } from 'vuetify/components';
  import { useDisplay } from 'vuetify';
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
      VRow,
      VCol,
    },
    setup() {
      /** @type {import("../vcsUiApp.js").default} */
      const app = inject('vcsApp');
      const searching = ref(false);
      const suggesting = ref('');
      const { query } = app.search;
      const suggestions = ref([]);
      const selectedSuggestion = ref(-1);
      const results = app.search.currentResults;
      const { xs } = useDisplay();
      let queryPreSuggestion = '';

      const showSelectedOnly = ref(false);

      let suggestionTimeout;

      const onInput = () => {
        app.search.clearResults();
        const trimmedInput = query.value?.trim() ?? '';
        if (trimmedInput.length > 0) {
          const requestId = uuid();
          if (suggestionTimeout) {
            clearTimeout(suggestionTimeout);
          }
          suggestionTimeout = setTimeout(() => {
            suggesting.value = requestId;
            queryPreSuggestion = trimmedInput;
            selectedSuggestion.value = -1;
            app.search
              .suggest(trimmedInput)
              .then((s) => {
                if (suggesting.value === requestId) {
                  suggestions.value = s;
                  suggesting.value = '';
                }
              })
              .catch(() => {
                getLogger('SearchComponent.vue').warn('suggestion failed');
              });
          }, 200);
        } else {
          selectedSuggestion.value = -1;
          suggesting.value = '';
          suggestions.value = [];
          queryPreSuggestion = '';
        }
      };

      const reset = () => {
        app.search.clearResults();
        selectedSuggestion.value = -1;
        suggesting.value = '';
        suggestions.value = [];
        queryPreSuggestion = '';
        showSelectedOnly.value = false;
      };

      const search = async () => {
        reset();
        searching.value = true;
        try {
          await app.search.search(query.value.trim());
        } catch (e) {
          getLogger('Search').error(e);
        }
        searching.value = false;
      };

      const zoomToAll = () => {
        app.search.zoomToAll();
      };

      const fontSize = useFontSize();
      const searchIconSize = computed(() => {
        return fontSize.value + 11;
      });
      return {
        showSelectedOnly,
        xs,
        query,
        searching,
        results,
        reset,
        search,
        zoomToAll,
        searchIconSize,
        suggestions: computed(() =>
          suggestions.value.map((s) => ({
            title: s,
            clicked() {
              query.value = s;
              search();
            },
          })),
        ),
        selectedSuggestion,
        onInput,
        selectSuggestion(value) {
          const newSelection = selectedSuggestion.value + value;
          if (newSelection > -1 && newSelection < suggestions.value?.length) {
            selectedSuggestion.value = newSelection;
            query.value = suggestions.value[newSelection];
          } else {
            selectedSuggestion.value = -1;
            query.value = queryPreSuggestion;
          }
        },
      };
    },
  };
</script>

<style lang="scss" scoped>
  :deep(.v-field .v-field__outline *) {
    border-color: transparent !important;
  }

  .user-select-none {
    user-select: none;
  }

  .suggestions {
    font-style: italic;
  }
  .mobile-style .vcs-text-field.py-1 {
    padding-bottom: 0 !important;
    padding-right: 1px !important;
  }
  .button-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .fixed-button {
    flex-shrink: 0;
  }

  .ellipsis-button {
    flex-shrink: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
