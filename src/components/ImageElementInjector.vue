<template>
  <div />
</template>

<script>
  /**
   * @description A component injecting an HTMLCanvasElement or HTMLImageElement in a div.
   * @vue-prop {HTMLCanvasElement|HTMLImageElement} element
   */
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

<style scoped></style>
