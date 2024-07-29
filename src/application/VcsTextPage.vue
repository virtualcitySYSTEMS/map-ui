<template>
  <v-container>
    <VcsMarkdown :content="$st(content)"></VcsMarkdown>
  </v-container>
</template>

<style lang="scss" scoped>
  :deep(a) {
    color: var(--v-text-color);
  }
</style>

<script>
  import { VContainer } from 'vuetify/components';
  import VcsMarkdown from '../components/form-output/VcsMarkdown.vue';

  /**
   * @description Container wrapper around VcsMarkdown
   * @vue-prop {string} content - The markdown content to be rendered.
   */
  export default {
    name: 'VcsTextPage',
    props: {
      content: {
        type: String,
        required: true,
      },
    },
    components: {
      VContainer,
      VcsMarkdown,
    },
  };
</script>
