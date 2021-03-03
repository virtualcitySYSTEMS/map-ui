<template>
  <span class="badge rounded-circle h-3 w-3" :class="[color]" />
</template>

<style lang="scss" scoped>
  .v-application .badge {
    border: 1px solid white !important;
  }
</style>


<script>
  import Vue from 'vue';

  /**
   * @description UI component representing a circular indicator.
   * @vue-prop {string} color - any of the theme colors.
   */
  export default Vue.extend({
    name: 'VcsBadge',
    props: {
      color: {
        type: String,
        default: 'warning',
      },
    },
  });
</script>
