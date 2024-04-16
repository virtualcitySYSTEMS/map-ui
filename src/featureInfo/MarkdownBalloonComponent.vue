<template>
  <BalloonComponent v-bind="{ ...$attrs }">
    <div class="pa-2" v-html="html" />
  </BalloonComponent>
</template>
<script>
  import BalloonComponent from './BalloonComponent.vue';

  /**
   * @description A balloon showing markdown content
   */
  export default {
    name: 'MarkdownBalloonComponent',
    props: {
      html: {
        type: String,
        required: true,
      },
    },
    components: {
      BalloonComponent,
    },
  };
</script>
