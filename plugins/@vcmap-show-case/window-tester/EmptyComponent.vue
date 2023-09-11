<template>
  <v-sheet style="height: 100%">
    <span> Static Window </span>
  </v-sheet>
</template>
<style scoped>
  .vcsTest span {
    background-color: red;
  }
</style>
<script>
  import { VSheet } from 'vuetify/lib';

  export default {
    name: 'EmptyComponent',
    components: { VSheet },
  };
</script>
