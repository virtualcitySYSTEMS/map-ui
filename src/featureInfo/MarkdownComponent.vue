<script setup>
  defineOptions({});

  defineProps({
    html: {
      type: String,
      required: true,
    },
  });
</script>

<template>
  <div class="pa-2" v-html="html" />
</template>

<style scoped lang="scss"></style>
