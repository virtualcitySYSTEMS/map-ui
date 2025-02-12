<template>
  <BalloonComponent v-bind="{ ...$attrs }" class="markdown-balloon-component">
    <vcs-template-markdown v-bind="{ ...$attrs }" />
  </BalloonComponent>
</template>
<script>
  import BalloonComponent from './BalloonComponent.vue';
  import VcsTemplateMarkdown from '../components/form-output/VcsTemplateMarkdown.vue';

  /**
   * @description A balloon showing markdown content
   */
  export default {
    name: 'MarkdownBalloonComponent',
    components: {
      VcsTemplateMarkdown,
      BalloonComponent,
    },
  };
</script>
