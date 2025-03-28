<template>
  <v-sheet style="height: 100%">
    <span> Static Window </span>
  </v-sheet>
</template>
<script>
  import { VSheet } from 'vuetify/components';

  export default {
    name: 'EmptyComponent',
    components: { VSheet },
  };
</script>
<style scoped>
  .vcsTest span {
    background-color: red;
  }
</style>
