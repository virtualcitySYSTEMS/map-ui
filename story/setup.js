import { computed, reactive, ref } from 'vue';
import { toggleDark } from 'histoire/client';
import { defineSetupVue3 } from '@histoire/plugin-vue';
import StoryWrapper from './StoryWrapper.vue';
import { createVcsVuetify } from '../src/vuePlugins/vuetify.js';
import { createSafeI18n, createVueI18n } from '../src/vuePlugins/i18n.js';
import en from '../src/i18n/en.js';
import '../src/styles/main.scss';
import '../public/assets/@mdi/font/css/materialdesignicons.min.css';

let i18nInstance;
function getI18n() {
  if (!i18nInstance) {
    i18nInstance = createVueI18n();
    i18nInstance.global.setLocaleMessage('en', en);
  }
  return i18nInstance;
}

let vuetifyInstance;

/**
 * @returns {ReturnType<typeof import("vuetify").createVuetify>}
 */
function getVuetify() {
  if (!vuetifyInstance) {
    vuetifyInstance = createVcsVuetify(getI18n());
  }
  return vuetifyInstance;
}

function createVariableComputed(vuetify, variable) {
  return computed({
    get() {
      return vuetify.theme.global.current.value.variables[variable];
    },
    set(value) {
      vuetify.theme.themes.value.dark.variables[variable] = value;
      vuetify.theme.themes.value.light.variables[variable] = value;
    },
  });
}

export function getStoryState(defaultIcon = '', wrapperType = 'window') {
  const vuetify = getVuetify();
  const darkMode = computed({
    get() {
      return vuetify.theme.global.current.value.dark;
    },
    set(value) {
      toggleDark(value);
      vuetify.theme.global.name.value = value ? 'dark' : 'light';
    },
  });

  const primaryColor = computed({
    get() {
      return vuetify.theme.global.current.value.colors.primary;
    },
    set(value) {
      vuetify.theme.themes.value.dark.colors.primary = value;
      vuetify.theme.themes.value.light.colors.primary = value;
    },
  });

  const fontSize = createVariableComputed(vuetify, 'vcs-font-size');
  const fontFamily = createVariableComputed(vuetify, 'vcs-font-family');

  const bindRef = ref({});

  const bind = computed({
    get() {
      return bindRef.value;
    },
    set(value) {
      bindRef.value = value;
    },
  });

  return reactive({
    icon: defaultIcon,
    wrapper: {
      type: wrapperType,
      cols: 6,
      title: 'Card Title',
      subtitle: 'Card Subtitle',
      height: 500,
      width: 320,
    },
    darkMode,
    primaryColor,
    fontSize,
    fontFamily,
    bind,
  });
}

export const setupVue3 = defineSetupVue3(({ app, addWrapper }) => {
  const i18n = getI18n();
  const vuetify = getVuetify();
  app.use(i18n);
  app.use(createSafeI18n());
  app.use(vuetify);
  addWrapper(StoryWrapper);
});
