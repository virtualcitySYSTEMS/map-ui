<template>
  <v-container class="pa-2">
    <v-row
      no-gutters
      align="center"
    >
      <v-col>
        <VcsLabel>
          {{ $t('settings.languageTitle') }}
        </VcsLabel>
      </v-col>
    </v-row>
    <v-row
      no-gutters
      align="center"
    >
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
  </v-container>
</template>

<script>
  import {
    ref, inject, onUnmounted, getCurrentInstance, computed,
  } from '@vue/composition-api';
  import VcsLabel from '../components/form-inputs-controls/VcsLabel.vue';
  import VcsSelect from '../components/form-inputs-controls/VcsSelect.vue';

  export default {
    name: 'VcsSettings',
    components: {
      VcsSelect,
      VcsLabel,
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
      const localeChangedListener = app.localeChanged.addEventListener(setLocale);
      const addedListener = app.i18n.added.addEventListener(setupI18n);
      const removedListener = app.i18n.removed.addEventListener(setupI18n);

      onUnmounted(() => {
        localeChangedListener();
        addedListener();
        removedListener();
      });
      return {
        language,
        languages,
      };
    },
  };
</script>
