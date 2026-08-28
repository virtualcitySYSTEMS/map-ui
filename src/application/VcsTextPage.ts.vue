<template>
  <v-container class="vcs-text-page">
    <VcsMarkdown :content="$st(content)"></VcsMarkdown>
  </v-container>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import { VContainer } from 'vuetify/components';
  import VcsMarkdown from '../components/form-output/VcsMarkdown.ts.vue';

  /**
   * @description Container wrapper around VcsMarkdown
   * @vue-prop {string} content - The markdown content to be rendered.
   */
  export default defineComponent({
    name: 'VcsTextPage',
    components: { VContainer, VcsMarkdown },
    props: { content: { type: String, required: true } },
  });
</script>

<style lang="scss" scoped>
  :deep(a) {
    color: var(--v-text-color);
  }
</style>
