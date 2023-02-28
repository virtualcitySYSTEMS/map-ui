<template>
  <span class="badge rounded-circle h-3 w-3" :class="[color]" />
</template>

<style lang="scss" scoped>
@import '../../styles/shades.scss';
  .v-application .theme--light .badge {
    border: 1px solid map-get($shades, 'white') !important;
  }
.v-application .theme--dark .badge {
  border: 1px solid map-get($shades, 'black') !important;
}
</style>


<script>

  /**
   * @description UI component representing a circular indicator.
   * @vue-prop {string} color - any of the theme colors.
   */
  export default {
    name: 'VcsBadge',
    props: {
      color: {
        type: String,
        default: 'warning',
      },
    },
  };
</script>
