<template>
  <VcsFormSection
    heading="extentExample.title"
    expandable
    start-open
    :header-actions="actions"
    v-if="localConfig.extent"
  >
    <VcsExtent v-model="localConfig.extent" />
  </VcsFormSection>
</template>

<script>
  import { computed, inject, onUnmounted } from 'vue';
  import {
    setupExtentComponentActions,
    VcsFormSection,
    VcsExtent,
  } from '@vcmap/ui';
  import { Extent } from '@vcmap/core';

  export default {
    name: 'ExtentExample',
    components: {
      VcsFormSection,
      VcsExtent,
    },
    props: {
      value: {
        type: Object,
        required: true,
      },
    },
    setup(props, { emit }) {
      const app = inject('vcsApp');
      const localConfig = computed({
        get() {
          return props.value;
        },
        set(value) {
          emit('input', value);
        },
      });

      const extent = computed({
        get() {
          return new Extent(localConfig.value.extent);
        },
        set(value) {
          localConfig.value.extent = value.toJSON();
        },
      });
      const { actions, destroy } = setupExtentComponentActions(
        app,
        extent,
        props.disabled,
      );

      onUnmounted(() => {
        destroy();
      });

      return {
        localConfig,
        actions,
      };
    },
  };
</script>

<style scoped></style>
