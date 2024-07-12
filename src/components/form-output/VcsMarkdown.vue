<template>
  <div class="marked" v-html="markedHtml"></div>
</template>
<style lang="scss" scoped>
  div {
    :deep(p) {
      margin-bottom: calc(var(--v-vcs-font-size) * 1);
    }
    :deep(h1) {
      margin-bottom: calc(var(--v-vcs-font-size) * 1);
    }
    :deep(h2) {
      margin-bottom: calc(
        var(--v-vcs-font-size) * 1
      ); /* or any other value you prefer */
    }
    :deep(ul) {
      margin-bottom: calc(
        var(--v-vcs-font-size) * 1
      ); /* or any other value you prefer */
    }
    :deep(ol) {
      margin-bottom: calc(
        var(--v-vcs-font-size) * 1
      ); /* or any other value you prefer */
    }
    :deep(li) {
      margin-left: 1.5em;
    }
  }
</style>
<script>
  import { computed } from 'vue';
  import { parseAndSanitizeMarkdown } from '../../application/markdownHelper.js';

  export default {
    name: 'VcsMarkdown',
    props: {
      content: {
        type: String,
        default: undefined,
      },
    },
    setup(props) {
      const markedHtml = computed(() =>
        parseAndSanitizeMarkdown(props.content),
      );
      return {
        markedHtml,
      };
    },
  };
</script>
