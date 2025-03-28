<template>
  <v-sheet class="pa-1">
    <ul>
      <li>Close window to get into background state.</li>
      <li>Click tristate button to deactivate</li>
    </ul>
  </v-sheet>
</template>

<script>
  import { VSheet } from 'vuetify/components';

  export default {
    name: 'WindowExampleContent',
    components: { VSheet },
    setup() {
      return {};
    },
  };
</script>
<style scoped></style>
