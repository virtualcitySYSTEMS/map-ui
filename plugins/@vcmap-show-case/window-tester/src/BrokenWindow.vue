<script setup>
  import { ref } from 'vue';
  import { VSheet, VCard } from 'vuetify/components';

  const prefix = undefined;
  const model = ref('foo');
</script>

<template>
  <v-sheet>
    <v-card class="pa-2" elevation="2">
      <input v-model="model" type="text" :prefix="prefix" />
    </v-card>
  </v-sheet>
</template>

<style scoped lang="scss"></style>
