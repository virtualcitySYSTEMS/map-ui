
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

  export default Vue.extend({
    components: {
      VcsApp,
    },
  });
</script>

