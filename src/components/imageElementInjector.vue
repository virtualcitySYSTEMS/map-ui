<template>
  <div />
</template>

<script>
  export default {
    name: 'ImageElementInjector',
    props: {
      element: {
        type: [HTMLCanvasElement, HTMLImageElement],
        required: true,
      },
    },
    mounted() {
      this.$el.replaceWith(this.element);
    },
  };
</script>

<style scoped>

</style>
