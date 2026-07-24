<template>
  <div />
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  /**
   * @description A component injecting an HTMLCanvasElement or HTMLImageElement in a div.
   * @vue-prop {HTMLCanvasElement|HTMLImageElement} element
   */
  export default defineComponent({
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
  });
</script>

<style scoped></style>
