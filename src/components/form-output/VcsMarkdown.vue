<template>
  <div
    class="marked vcs-markdown"
    :class="{
      'pa-2': !paddingProvided,
    }"
    v-html="markedHtml"
  ></div>
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
      margin-bottom: calc(var(--v-vcs-font-size) * 1);
    }
    :deep(ul) {
      margin-bottom: calc(var(--v-vcs-font-size) * 1);
    }
    :deep(ol) {
      margin-bottom: calc(var(--v-vcs-font-size) * 1);
    }
    :deep(li) {
      margin-left: 1.5em;
    }
  }
</style>
<script>
  import { computed } from 'vue';
  import { parseAndSanitizeMarkdown } from './markdownHelper.js';
  import { usePadding } from '../composables.js';

  export default {
    name: 'VcsMarkdown',
    props: {
      content: {
        type: String,
        default: undefined,
      },
    },
    setup(props, { attrs }) {
      const markedHtml = computed(() =>
        parseAndSanitizeMarkdown(props.content),
      );
      const paddingProvided = usePadding(attrs);
      return {
        markedHtml,
        paddingProvided,
      };
    },
  };
</script>
