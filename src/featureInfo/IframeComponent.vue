<template>
  <iframe
    :src="src"
    :title="title"
    class="h-100 w-100 border-0 d-block flex-grow-1"
  />
</template>
<script>
  /**
   * @description An iframe component
   * @vue-prop {string} src - Specifies the address of the document to embed in the <iframe>
   * @vue-prop {string} [title] - optional title for the <iframe>
   * @vue-prop {Object} [attributes] - Not used, defined because of attrs inheritance
   */
  export default {
    name: 'IframeComponent',
    props: {
      src: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        default: undefined,
      },
      /**
       * define attributes prop to prevent passing on as $attrs
       */
      attributes: {
        type: Object,
        default: () => {},
      },
    },
  };
</script>

<style scoped></style>
