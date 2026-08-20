<script setup lang="ts">
  import type { Ref } from 'vue';
  import { computed, inject, ref } from 'vue';
  import { getLogger } from '@vcsuite/logger';
  import { getCaughtError } from '@vcmap/core';
  import { v4 as uuid } from 'uuid';
  import { VSheet, VDivider, VIcon, VRow, VCol } from 'vuetify/components';
  import { useDisplay } from 'vuetify';
  import type VcsUiApp from '../vcsUiApp.js';
  import VcsTextField from '../components/form-inputs-controls/VcsTextField.ts.vue';
  import ResultsComponent from './ResultsComponent.ts.vue';
  import VcsFormButton from '../components/buttons/VcsFormButton.ts.vue';
  import { useFontSize } from '../vuePlugins/vuetify.js';
  import type { ResultItem } from './search.js';
  import { searchComponentId } from './helper.js';

  /**
   * @description Stylized search component providing an input field for search inputs.
   * Renders a list of results using {@link ResultsComponent }
   */
  const app = inject<VcsUiApp>('vcsApp')!;
  const searching = ref(false);
  const suggesting = ref('');
  const { query } = app.search;
  const suggestions = ref<string[]>([]);
  const selectedSuggestion = ref(-1);
  const results: Ref<ResultItem[]> = app.search.currentResults;
  const { xs } = useDisplay();
  let queryPreSuggestion = '';

  let suggestionTimeout: number | undefined;

  const onInput = (): void => {
    app.search.clearResults();
    const trimmedInput = query.value?.trim() ?? '';
    if (trimmedInput.length > 0) {
      const requestId = uuid();
      if (suggestionTimeout) {
        clearTimeout(suggestionTimeout);
      }
      suggestionTimeout = setTimeout((): void => {
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
            getLogger('SearchComponent.ts.vue').warning('suggestion failed');
          });
      }, 200);
    } else {
      selectedSuggestion.value = -1;
      suggesting.value = '';
      suggestions.value = [];
      queryPreSuggestion = '';
    }
  };

  const reset = (): void => {
    app.search.clearResults();
    selectedSuggestion.value = -1;
    suggesting.value = '';
    suggestions.value = [];
    queryPreSuggestion = '';
  };

  const search = async (): Promise<void> => {
    reset();
    searching.value = true;
    try {
      await app.search.search(query.value.trim());
    } catch (e: unknown) {
      getLogger('Search').error(getCaughtError(e).message);
    }
    searching.value = false;
  };

  const fontSize = useFontSize();
  const searchIconSize = computed(() => fontSize.value + 11);

  const zoomToAll = async (): Promise<void> => {
    await app.search.zoomToAll();
  };
  const computedSuggestions = computed<ResultItem[]>(() =>
    suggestions.value.map((s) => ({
      title: s,
      async clicked(): Promise<void> {
        query.value = s;
        await search();
      },
    })),
  );

  function selectSuggestion(value: number): void {
    const newSelection = selectedSuggestion.value + value;
    if (newSelection > -1 && newSelection < suggestions.value?.length) {
      selectedSuggestion.value = newSelection;
      query.value = suggestions.value[newSelection];
    } else {
      selectedSuggestion.value = -1;
      query.value = queryPreSuggestion;
    }
  }
  function closeWindow(): void {
    app.windowManager.remove(searchComponentId);
  }
</script>

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
        :placeholder="$st('search.placeholder')"
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
      <ResultsComponent :query="query" :results="results" />
      <v-divider />

      <v-row no-gutters>
        <v-col>
          <div class="button-container d-flex align-center px-2 pt-2 pb-1">
            <VcsFormButton
              class="fixed-button"
              tooltip="search.hideWindow"
              @click="closeWindow"
            >
              <v-icon icon="mdi-minus-box-multiple-outline" />
            </VcsFormButton>
            <VcsFormButton
              @click="zoomToAll"
              class="ellipsis-button"
              variant="outlined"
            >
              {{ xs ? $st('search.zoomToAllMobile') : $st('search.zoomToAll') }}
            </VcsFormButton>
          </div></v-col
        ></v-row
      >
    </template>
    <template v-else-if="suggestions.length > 0">
      <v-divider class="mt-1 base-darken-1" />
      <ResultsComponent
        class="suggestions"
        :results="computedSuggestions"
        :query="query"
        :selected-index="selectedSuggestion"
      />
    </template>
  </v-sheet>
</template>

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
