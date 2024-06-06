<script setup>
  import {
    VApp,
    VContainer,
    VRow,
    VCol,
    VCard,
    VSheet,
  } from 'vuetify/components';
  import { computed } from 'vue';

  /**
   * @typedef {Object} SizeProps
   * @property {number|string} [width=320]
   * @property {number|string} height
   */

  /**
   * @typedef {Object & SizeProps} RowWrapper
   * @property {'row'} type
   * @property {number} [cols=6] - number of columns
   */

  /**
   * @typedef {Object & SizeProps} CardWrapper
   * @property {'card'} type
   * @property {string} title - card title
   * @property {string} subtitle - card subtitle
   */

  /**
   * @typedef {Object & SizeProps} SheetWrapper
   * @property {'sheet'} type
   */

  /**
   * @type {RowWrapper|CardWrapper|SheetWrapper|boolean} Wrapper
   */

  const props = defineProps({
    story: {
      type: Object,
      required: true,
    },
    variant: {
      type: Object,
      default: undefined,
    },
  });

  const wrapperComponent = computed(() => {
    if (
      props.story.meta?.wrapper !== false &&
      props.variant?.meta?.wrapper !== false
    ) {
      return VApp;
    }
    return 'div';
  });

  const style = computed(() => ({
    'border-style': 'dotted',
    'border-width': '2px',
    ...(props.story.meta?.wrapper.style & {}),
    width: props.story.meta?.wrapper?.width || '320px',
    height: props.story.meta?.wrapper?.height,
  }));
</script>

<template>
  <component :is="wrapperComponent" class="custom-wrapper">
    <v-container v-if="story.meta?.wrapper?.type === 'row'" :style="style">
      <v-row>
        <v-col :cols="story.meta?.wrapper?.cols || 6">
          <slot />
        </v-col>
      </v-row>
    </v-container>
    <v-card
      v-else-if="story.meta?.wrapper?.type === 'card'"
      :title="story.meta?.wrapper?.title"
      :subtitle="story.meta?.wrapper?.subtitle"
      :style="style"
    >
      <slot />
    </v-card>
    <v-sheet v-else-if="story.meta?.wrapper?.type === 'sheet'" :style="style">
      <div class="overflow-x-hidden">
        <slot />
      </div>
    </v-sheet>
    <template v-else>
      <slot />
    </template>
  </component>
</template>

<style scoped lang="scss">
  :deep(.v-application--wrap) {
    min-height: fit-content;
  }
  .align-wrapper {
    position: absolute;
    right: 0;
    margin-right: 4px !important;
  }

  // XXX very ugly hack due to: https://github.com/histoire-dev/histoire/issues/585
  .histoire-generic-render-story:is(.__histoire-render-custom-controls) {
    .custom-wrapper {
      background: transparent;
      margin-bottom: 0.5rem;

      --v-vcs-font-size: '15px';
      --v-vcs-font-family: 'Helvetica';

      :deep(.v-application__wrap) {
        min-height: 0;
      }
    }
  }
</style>
