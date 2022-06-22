<template>
  <v-app>
    <VcsApp :app-id="appId" />
  </v-app>
</template>

<script>
  import VcsApp from './VcsApp.vue';

  /**
   * This component wraps the {@see VcsApp} component in a
   * v-app tag to ensure vuetify functionality. If you provide your own vuetify app,
   * do NOT use this wrapper, but use {@see VcsApp} directly, since you may only use v-app once.
   */
  export default {
    name: 'VcsAppWrapper',
    props: {
      appId: {
        type: String,
        required: true,
      },
    },
    components: { VcsApp },
  };
</script>

<style scoped>

</style>
