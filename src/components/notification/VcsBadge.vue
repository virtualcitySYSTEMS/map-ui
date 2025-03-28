<template>
  <span class="vcs-badge rounded-circle h-3 w-3" :class="[color]" />
</template>

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
        default: 'bg-warning',
      },
    },
  };
</script>

<style lang="scss" scoped>
  .vcs-badge {
    border: 1px solid rgb(var(--v-theme-surface)) !important;
  }
  .h-3 {
    height: 12px;
  }
  .w-3 {
    width: 12px;
  }
</style>
