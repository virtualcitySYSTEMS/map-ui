<template>
  <BalloonComponent
    v-bind="{ ...$props, ...$attrs }"
    class="markdown-balloon-component"
  >
    <VcsTemplateMarkdown v-bind="{ ...$attrs }" />
  </BalloonComponent>
</template>

<script lang="ts">
  import type { Coordinate } from 'ol/coordinate.js';
  import { defineComponent, type PropType } from 'vue';
  import BalloonComponent from './BalloonComponent.ts.vue';
  import type { HTMLTagOptions } from './abstractFeatureInfoView.js';
  import VcsTemplateMarkdown from '../components/form-output/VcsTemplateMarkdown.vue';

  /**
   * @description A balloon showing markdown content
   */
  export default defineComponent({
    name: 'MarkdownBalloonComponent',
    components: { VcsTemplateMarkdown, BalloonComponent },
    props: {
      featureId: {
        type: String,
        required: true,
      },
      balloonTitle: {
        type: String,
        required: true,
      },
      balloonSubtitle: {
        type: String,
        required: true,
      },
      attributes: {
        type: Object as PropType<Record<string, unknown>>,
        required: true,
      },
      tags: {
        type: Object as PropType<HTMLTagOptions>,
        default: undefined,
      },
      position: {
        type: Array as PropType<Coordinate>,
        default: null,
      },
    },
  });
</script>
