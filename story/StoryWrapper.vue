<script setup>
  import { VApp } from 'vuetify/components';
  import { computed } from 'vue';

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
</script>

<template>
  <component :is="wrapperComponent" class="custom-wrapper">
    <slot />
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
