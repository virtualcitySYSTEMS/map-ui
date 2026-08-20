<template>
  <span class="vcs-badge rounded-circle" :class="color" />
</template>

<script lang="ts">
  import { defineComponent } from 'vue';

  /**
   * @description UI component representing a circular indicator.
   * @vue-prop {string} color - any of the theme colors.
   */
  export default defineComponent({
    name: 'VcsBadge',
    props: {
      color: {
        type: String,
        default: 'bg-warning',
      },
    },
  });
</script>

<style lang="scss" scoped>
  .vcs-badge {
    width: 10px;
    height: 10px;
  }
</style>
