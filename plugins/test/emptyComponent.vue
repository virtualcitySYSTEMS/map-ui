<template>
  <v-sheet style="height: 100%">
    Statisches Window
    <v-sheet />
  </v-sheet>
</template>

<script>

  import { VSheet } from 'vuetify/lib';

  export default {
    name: 'EmptyComponent',
    components: [VSheet],
  };
</script>
