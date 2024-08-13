<template>
  <BalloonComponent v-bind="{ ...$attrs }">
    <VcsMarkdown :content="content" />
  </BalloonComponent>
</template>
<script>
  import BalloonComponent from './BalloonComponent.vue';
  import VcsMarkdown from '../components/form-output/VcsMarkdown.vue';

  /**
   * @description A balloon showing markdown content
   */
  export default {
    name: 'MarkdownBalloonComponent',
    props: {
      content: {
        type: String,
        required: true,
      },
    },
    components: {
      VcsMarkdown,
      BalloonComponent,
    },
  };
</script>
