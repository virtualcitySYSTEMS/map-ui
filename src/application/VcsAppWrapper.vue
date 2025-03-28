<template>
  <v-app class="vcs-app-wrapper">
    <VcsApp :app-id="appId" />
  </v-app>
</template>

<script>
  import { VApp } from 'vuetify/components';
  import VcsApp from './VcsApp.vue';

  /**
   * @description This component wraps the {@see VcsApp} component in a
   * v-app tag to ensure vuetify functionality. If you provide your own vuetify app,
   * do NOT use this wrapper, but use {@see VcsApp} directly, since you may only use v-app once.
   * @vue-prop {string} appId - the app to wrap. will be passed to the VcsApp component
   */
  export default {
    name: 'VcsAppWrapper',
    components: {
      VcsApp,
      VApp,
    },
    props: {
      appId: {
        type: String,
        required: true,
      },
    },
  };
</script>

<style scoped></style>
