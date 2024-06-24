<template>
  <v-container class="px-1 py-0">
    <v-row no-gutters>
      <v-col>
        <VcsLabel html-for="settingsLanguageSelect">
          {{ $t('settings.languageSelector') }}
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
        {{ $t('settings.displayQuality.title') }}
      </VcsLabel>
    </v-row>
    <v-row v-if="is3D" no-gutters class="quality-slider-padding">
      <VcsSlider
        step="1"
        v-model="displaySettings"
        type="number"
        max="2"
        min="0"
        ticks="always"
        tick-size="5"
        :tick-labels="[
          $t('settings.displayQuality.level.low'),
          $t('settings.displayQuality.level.medium'),
          $t('settings.displayQuality.level.high'),
        ]"
      />
    </v-row>
    <v-row no-gutters>
      <v-col>
        <VcsLabel html-for="settingsLanguageSelect">
          {{ $t('settings.theme.title') }}
        </VcsLabel>
      </v-col>
      <v-col>
        <VcsRadio
          dense
          :items="[
            { label: 'settings.theme.light', value: false },
            { label: 'settings.theme.dark', value: true },
          ]"
          v-model="$vuetify.theme.dark"
          row
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
  import { ref, inject, onUnmounted, getCurrentInstance, computed } from 'vue';
  import { VCol, VContainer, VRow } from 'vuetify/lib';
  import { CesiumMap, DisplayQualityLevel } from '@vcmap/core';
  import VcsLabel from '../components/form-inputs-controls/VcsLabel.vue';
  import VcsSelect from '../components/form-inputs-controls/VcsSelect.vue';
  import VcsRadio from '../components/form-inputs-controls/VcsRadio.vue';
  import VcsSlider from '../components/form-inputs-controls/VcsSlider.vue';

  /**
   * @description The settings window of a VcsMap application
   */
  export default {
    name: 'VcsSettings',
    components: {
      VcsSlider,
      VcsSelect,
      VcsRadio,
      VcsLabel,
      VContainer,
      VRow,
      VCol,
    },
    setup() {
      const app = inject('vcsApp');
      const languages = ref([]);
      const localLanguage = ref('');
      const language = computed({
        get() {
          return localLanguage.value;
        },
        set(value) {
          app.locale = value;
        },
      });
      const vm = getCurrentInstance().proxy;
      const setupI18n = () => {
        languages.value = [...vm.$i18n.availableLocales];
        if (!languages.value.includes(localLanguage.value)) {
          localLanguage.value = languages.value[0];
        }
      };
      setupI18n();
      const setLocale = () => {
        localLanguage.value = app.locale;
      };
      setLocale();
      const localeChangedListener =
        app.localeChanged.addEventListener(setLocale);
      const addedListener = app.i18n.added.addEventListener(setupI18n);
      const removedListener = app.i18n.removed.addEventListener(setupI18n);

      const levels = [
        DisplayQualityLevel.LOW,
        DisplayQualityLevel.MEDIUM,
        DisplayQualityLevel.HIGH,
      ];
      const localDisplaySettings = ref();
      const displaySettings = computed({
        get() {
          return localDisplaySettings.value;
        },
        set(value) {
          app.displayQuality.setLevel(levels[value]);
        },
      });
      const setDisplayQualityLevel = () => {
        localDisplaySettings.value = levels.indexOf(
          app.displayQuality.currentQualityLevel,
        );
      };
      setDisplayQualityLevel();
      const displayQualityListener =
        app.displayQuality.qualityLevelChanged.addEventListener(
          setDisplayQualityLevel,
        );

      const is3D = ref(false);
      const updateIs3D = () => {
        is3D.value = app.maps.activeMap instanceof CesiumMap;
      };
      const mapActivatedListener =
        app.maps.mapActivated.addEventListener(updateIs3D);
      updateIs3D();

      onUnmounted(() => {
        localeChangedListener();
        addedListener();
        removedListener();
        displayQualityListener();
        mapActivatedListener();
      });

      return {
        language,
        languages,
        displaySettings,
        is3D,
      };
    },
  };
</script>
<style scoped>
  .quality-slider-padding {
    padding-bottom: 20px !important;
  }
</style>
