<template>
  <iframe
    :src="src"
    :title="title"
    :style="{ height, width }"
    class="iframe-component"
  />
</template>
<script>
  import { inject } from 'vue';
  import {
    getTargetSize,
    posToNumber,
  } from '../manager/window/windowHelper.js';

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
    setup(props, { attrs }) {
      const app = inject('vcsApp');
      let { height, width } = app.windowManager.get(
        attrs['window-state'].id,
      ).position;

      // set iframe size to absolute px values
      if (app.maps.target) {
        const targetSize = getTargetSize(app.maps.target);
        const heightNumber = posToNumber(height, 'height', targetSize);
        if (heightNumber) {
          height = `${heightNumber - 36}px`; // 32px header height + 4px margin
        }
        const widthNumber = posToNumber(width, 'width', targetSize);
        if (widthNumber) {
          width = `${widthNumber}px`;
        }
      }

      return {
        height,
        width,
      };
    },
  };
</script>

<style scoped></style>
