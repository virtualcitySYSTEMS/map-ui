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

  import Vue from 'vue';

  export default Vue.extend({
    name: 'VcsContent',
    setup() {
      return { };
    },
  });
</script>
