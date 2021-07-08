
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
  import { Cartographic } from '@vcmap/cesium';

  /**
   * @description
   * Base of app. Provides vuetify styling root.
   */
  export default Vue.extend({
    components: {
      VcsApp,
    },
    setup() {
      const carto = new Cartographic(1,2,3);
      console.log(carto);
      return {};
    },
    provide: {
      language: window.navigator.language.split('-')[0],
    },
  });
</script>

