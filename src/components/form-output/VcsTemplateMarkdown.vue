<script setup>
  import { computed, inject, toRaw } from 'vue';
  import { renderTemplate } from '@vcmap/core';
  import VcsMarkdown from './VcsMarkdown.vue';

  const app = inject('vcsApp');

  const props = defineProps({
    /**
     * The template to render to markdown.
     */
    template: {
      type: String,
      default: '',
    },
    /**
     * The context to render the template with.
     * The context will get augmented with the currentVcsAppLocale.
     * Template re-renders on locale change and uses vue18n.t for translation.
     */
    context: {
      type: Object,
      default: () => ({}),
    },
  });

  const content = computed(() => {
    return renderTemplate(
      props.template,
      {
        ...toRaw(props.context),
        currentVcsAppLocale: app.vueI18n.locale.value,
      },
      (key) => app.vueI18n.t(key),
    );
  });
</script>

<template>
  <vcs-markdown :content="content" />
</template>

<style scoped lang="scss"></style>
