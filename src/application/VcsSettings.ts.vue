<script setup lang="ts">
  import { CesiumMap, DisplayQualityLevel } from '@vcmap/core';
  import { computed, inject, onUnmounted, ref } from 'vue';
  import { useTheme } from 'vuetify';
  import { VCol, VContainer, VRow } from 'vuetify/components';
  import { getLogger } from '@vcsuite/logger';
  import type VcsUiApp from '../vcsUiApp.js';
  import VcsLabel from '../components/form-inputs-controls/VcsLabel.ts.vue';
  import VcsSelect from '../components/form-inputs-controls/VcsSelect.ts.vue';
  import VcsRadio from '../components/form-inputs-controls/VcsRadio.ts.vue';
  import VcsSlider from '../components/form-inputs-controls/VcsSlider.ts.vue';

  /**
   * @description The settings window of a VcsMap application
   */

  const app = inject('vcsApp') as VcsUiApp;
  const languages = ref<string[]>([]);
  const localLanguage = ref('');
  const language = computed({
    get: () => localLanguage.value,
    set(value) {
      app.locale = value;
    },
  });
  const setupI18n = (): void => {
    languages.value = [...app.vueI18n.availableLocales].filter((lang) => {
      return Object.keys(app.vueI18n.getLocaleMessage(lang)).length > 0;
    });
    if (!languages.value.includes(localLanguage.value)) {
      localLanguage.value = languages.value[0];
    }
  };
  setupI18n();
  const setLocale = (): void => {
    if (!languages.value.includes(app.locale)) {
      localLanguage.value = 'en';
      return;
    }
    localLanguage.value = app.locale;
  };
  setLocale();

  const localeChangedListener = app.localeChanged.addEventListener(setLocale);
  const addedListener = app.i18n.added.addEventListener(setupI18n);
  const removedListener = app.i18n.removed.addEventListener(setupI18n);

  const levels = [
    DisplayQualityLevel.LOW,
    DisplayQualityLevel.MEDIUM,
    DisplayQualityLevel.HIGH,
  ];
  const localDisplaySettings = ref<number>();
  const displaySettings = computed({
    get: () => localDisplaySettings.value,
    set(value) {
      if (value) {
        app.displayQuality.setLevel(levels[value]);
      }
    },
  });
  const setDisplayQualityLevel = (): void => {
    const level = app.displayQuality.currentQualityLevel;
    if (level) {
      localDisplaySettings.value = levels.indexOf(level);
    }
  };
  setDisplayQualityLevel();
  const displayQualityListener =
    app.displayQuality.qualityLevelChanged.addEventListener(
      setDisplayQualityLevel,
    );

  const is3D = ref(false);
  const updateIs3D = (): void => {
    is3D.value = app.maps.activeMap instanceof CesiumMap;
  };
  const mapActivatedListener =
    app.maps.mapActivated.addEventListener(updateIs3D);
  updateIs3D();

  const theme = useTheme();
  const themeMode = computed({
    get: () => theme.current.value.dark,
    set(value) {
      theme.change(value ? 'dark' : 'light').catch((e: unknown) => {
        getLogger('VcsSettings').error('Failed to change theme', e);
      });
    },
  });

  onUnmounted(() => {
    localeChangedListener();
    addedListener();
    removedListener();
    displayQualityListener();
    mapActivatedListener();
  });
</script>

<template>
  <v-container class="px-1 py-0 vcs-settings">
    <v-row no-gutters>
      <v-col>
        <VcsLabel html-for="settingsLanguageSelect">
          {{ $st('settings.languageSelector') }}
        </VcsLabel>
      </v-col>
      <v-col>
        <VcsSelect
          id="settingsLanguageSelect"
          :items="languages"
          v-model="language"
        />
      </v-col>
    </v-row>
    <v-row v-if="is3D" no-gutters>
      <VcsLabel html-for="settingsDisplayQuality">
        {{ $st('settings.displayQuality.title') }}
      </VcsLabel>
    </v-row>
    <v-row v-if="is3D" no-gutters>
      <VcsSlider
        :step="1"
        v-model="displaySettings"
        :max="2"
        :min="0"
        show-ticks="always"
        :ticks="{
          0: $st('settings.displayQuality.level.low'),
          1: $st('settings.displayQuality.level.medium'),
          2: $st('settings.displayQuality.level.high'),
        }"
      />
    </v-row>
    <v-row no-gutters>
      <v-col>
        <VcsLabel html-for="settingsLanguageSelect">
          {{ $st('settings.theme.title') }}
        </VcsLabel>
      </v-col>
      <v-col>
        <VcsRadio
          :items="[
            { label: 'settings.theme.light', value: false },
            { label: 'settings.theme.dark', value: true },
          ]"
          v-model="themeMode"
          inline
        />
      </v-col>
    </v-row>
  </v-container>
</template>
