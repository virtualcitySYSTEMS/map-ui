<script setup>
  import {
    VApp,
    VContainer,
    VRow,
    VCol,
    VCard,
    VCardText,
    VSheet,
  } from 'vuetify/components';
  import { computed, onMounted, ref } from 'vue';

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

  const storyWrapper = ref();
  const isStory = ref(false);
  onMounted(() => {
    isStory.value =
      storyWrapper.value.$el.parentElement?.parentElement?.parentElement
        ?.className === 'histoire-generic-render-story __histoire-render-story';
  });
</script>

<template>
  <component :is="wrapperComponent" class="custom-wrapper" ref="storyWrapper">
    <template v-if="isStory && story.meta?.wrapper">
      <v-sheet
        v-if="story.meta?.wrapper?.type === 'window'"
        :width="story.meta?.wrapper?.width || 320"
        :height="story.meta?.wrapper?.height || 500"
        :style="story.meta?.wrapper?.style"
        class="wrapper-border elevation-3 d-flex flex-column"
      >
        <div class="overflow-x-hidden h-100">
          <slot />
        </div>
      </v-sheet>
      <v-container
        v-else-if="story.meta?.wrapper?.type === 'row'"
        class="wrapper-border"
        :style="story.meta?.wrapper?.style"
      >
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
        :width="story.meta?.wrapper?.width"
        :height="story.meta?.wrapper?.height"
        :style="story.meta?.wrapper?.style"
      >
        <v-card-text>
          <slot />
        </v-card-text>
      </v-card>
    </template>
    <template v-else>
      <slot />
    </template>
  </component>
</template>

<style scoped lang="scss">
  :deep(.v-application__wrap) {
    min-height: fit-content;
  }
  .align-wrapper {
    position: absolute;
    right: 0;
    margin-right: 4px !important;
  }
  .wrapper-border {
    border-style: dotted;
    border-width: 2px;
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
