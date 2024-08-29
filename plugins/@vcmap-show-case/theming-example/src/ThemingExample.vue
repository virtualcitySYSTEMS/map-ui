<template>
  <VCard>
    <VcsFormSection heading="Colors" expandable start-open>
      <v-container class="px-1 py-0">
        <v-row
          v-for="key in Object.keys(currentTheme.colors)"
          :key="key"
          no-gutters
        >
          <v-col>
            <VcsLabel>{{ key }}</VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField
              v-model="currentTheme.colors[key]"
              :bg-color="currentTheme.colors[key]"
            ></VcsTextField>
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>
    <VcsFormSection heading="Variables" expandable start-open>
      <v-container class="px-1 py-0">
        <v-row
          no-gutters
          v-for="key in Object.keys(currentTheme.variables)"
          :key="key"
        >
          <v-col>
            <VcsLabel>{{ key }}</VcsLabel>
          </v-col>
          <v-col>
            <VcsTextField v-model="currentTheme.variables[key]"></VcsTextField>
          </v-col>
        </v-row>
      </v-container>
    </VcsFormSection>
    <v-container class="px-1 py-0">
      <VcsFormButton @click="reset"> Reset default </VcsFormButton>
    </v-container>
  </VCard>
</template>

<script>
  import {
    createVcsThemes,
    VcsTextField,
    VcsLabel,
    VcsFormSection,
    VcsFormButton,
    isDark,
  } from '@vcmap/ui';
  import {
    watch,
    inject,
    ref,
    computed,
    toRaw,
    onMounted,
    onUnmounted,
  } from 'vue';
  import { VCard, VCol, VRow, VContainer } from 'vuetify/components';

  export default {
    name: 'ThemingExample',
    components: {
      VcsLabel,
      VcsFormSection,
      VcsFormButton,
      VcsTextField,
      VContainer,
      VCard,
      VRow,
      VCol,
    },
    setup() {
      const app = inject('vcsApp');
      const theming = ref(createVcsThemes());
      const currentTheme = computed(() => {
        if (isDark(app)) {
          return theming.value.dark;
        } else {
          return theming.value.light;
        }
      });
      onMounted(() => {
        app.uiConfig.override({
          name: 'vuetifyTheme',
          value: toRaw(theming.value),
        });
      });
      onUnmounted(() => {
        app.uiConfig.remove(app.uiConfig.getByKey('vuetifyTheme'));
      });
      watch(
        () => theming.value,
        () => {
          app.uiConfig.replace({
            name: 'vuetifyTheme',
            value: toRaw(theming.value),
          });
        },
        { deep: true },
      );
      return {
        reset: () => {
          theming.value = createVcsThemes();
        },
        theming,
        currentTheme,
      };
    },
  };
</script>

<style scoped></style>
