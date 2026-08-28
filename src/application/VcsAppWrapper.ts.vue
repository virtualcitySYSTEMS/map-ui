<script setup lang="ts">
  import { VApp } from 'vuetify/components';
  import VcsApp from './VcsApp.ts.vue';

  /**
   * @description This component wraps the {@see VcsApp} component in a
   * v-app tag to ensure vuetify functionality. If you provide your own vuetify app,
   * do NOT use this wrapper, but use {@see VcsApp} directly, since you may only use v-app once.
   * @vue-prop {string} appId - the app to wrap. will be passed to the VcsApp component
   */
  defineProps<{ appId: string }>();
</script>

<template>
  <v-app class="vcs-app-wrapper">
    <VcsApp :app-id="appId" />
  </v-app>
</template>

<style scoped></style>
