
<template>
  <v-app class="bg-dev">
    <v-main>
      <VcsApp />
    </v-main>
  </v-app>
</template>


<script>
  import Vue from 'vue';

  import VcsApp from './components/VcsApp.vue';

  /**
   * @description
   * Base of app. Provides vuetify styling root.
   */
  export default Vue.extend({
    components: {
      VcsApp,
    },
    provide: {
      language: window.navigator.language.split('-')[0],
    },
  });
</script>

