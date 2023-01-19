<template>
  <v-sheet>
    <span>
      content
    </span>
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
    name: 'WindowExampleContent',
    components: { VSheet },
    setup() {
      return { };
    },
  };
</script>
