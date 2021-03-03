<template>
  <v-divider
    vertical
    :style="{ maxHeight: `${height}px`, minHeight: `${height}px`, alignSelf: 'auto' }"
  />
</template>

<style scoped>
  hr {
    border-color: #b1b1b1;
  }
</style>

<script>
  import Vue from 'vue';

  /**
   * @description Stylized wrapper around vuetify divider
   * @vue-prop {number}   height - Height of the component.
   */
  export default Vue.extend({
    name: 'VcsNavbarDivider',
    props: {
      height: {
        type: Number,
        default: 24,
      },
    },
  });
</script>
