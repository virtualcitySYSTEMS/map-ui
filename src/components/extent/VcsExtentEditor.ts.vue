<script setup lang="ts">
  import type { PropType } from 'vue';
  import { computed, inject, onUnmounted } from 'vue';
  import type { ExtentOptions } from '@vcmap/core';
  import { Extent } from '@vcmap/core';
  import { useProxiedComplexModel } from '../modelHelper.js';
  import { setupExtentComponentActions } from '../../actions/extentActions.js';
  import VcsExtent from './VcsExtent.ts.vue';
  import VcsFormSection from '../section/VcsFormSection.ts.vue';
  import type VcsUiApp from '../../vcsUiApp.js';

  /**
   * A VcsFormSection with actions to draw and edit an extent
   * Uses VcsExtent for editing the extent options via input field
   * @vue-prop {import("@vcmap/core").ExtentOptions} [modelValue] - the extent options to be modeled.
   * @vue-prop {boolean} [disabled=false] - Disable coordinate input.
   * @vue-prop {string} [heading='components.extent.title'] - Header of the form section
   * @vue-prop {boolean} [showExtentOnStartup=false] - Whether to activate the extent layer on startup
   */

  const props = defineProps({
    modelValue: {
      type: Object as PropType<ExtentOptions>,
      default: () => new Extent().toJSON(),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    heading: {
      type: String,
      default: 'components.extent.title',
    },
    showExtentOnStartup: {
      type: Boolean,
      default: false,
    },
  });
  const emit = defineEmits(['update:modelValue']);

  const app = inject<VcsUiApp>('vcsApp')!;
  const localValue = useProxiedComplexModel(props, 'modelValue', emit);

  const extent = computed<Extent>({
    get: () => new Extent(localValue.value),
    set(value) {
      localValue.value = value.toJSON();
    },
  });

  const { actions, destroy } = setupExtentComponentActions(
    app,
    extent,
    props.showExtentOnStartup,
  );

  onUnmounted(destroy);
</script>

<template>
  <VcsFormSection
    class="vcs-extent-editor"
    :heading="heading"
    :header-actions="actions"
    :action-button-list-overflow-count="3"
    :disabled="disabled"
    expandable
    start-open
    v-bind="$attrs"
  >
    <VcsExtent v-model="localValue" />
  </VcsFormSection>
</template>

<style scoped></style>
