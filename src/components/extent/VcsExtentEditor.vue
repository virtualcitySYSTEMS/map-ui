<template>
  <VcsFormSection
    class="vcs-extent-editor"
    :heading="heading"
    :header-actions="actions"
    :action-button-list-overflow-count="2"
    :disabled="disabled"
    expandable
    start-open
    v-bind="$attrs"
  >
    <VcsExtent v-model="localValue" />
  </VcsFormSection>
</template>

<script>
  import { computed, inject, onUnmounted } from 'vue';
  import { Extent } from '@vcmap/core';
  import { useProxiedComplexModel } from '../modelHelper.js';
  import { setupExtentComponentActions } from '../../actions/extentActions.js';
  import VcsExtent from './VcsExtent.vue';
  import VcsFormSection from '../section/VcsFormSection.vue';

  /**
   * A VcsFormSection with actions to draw and edit an extent
   * Uses VcsExtent for editing the extent options via input field
   * @vue-prop {import("@vcmap/core").ExtentOptions} [modelValue] - the extent options to be modeled.
   * @vue-prop {boolean} [disabled=false] - Disable coordinate input.
   * @vue-prop {string} [heading='component.extent.title] - Header of the form section
   */
  export default {
    name: 'VcsExtentEditor',
    components: {
      VcsFormSection,
      VcsExtent,
    },
    inheritAttrs: false,
    props: {
      modelValue: {
        type: Object,
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
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const app = inject('vcsApp');
      const localValue = useProxiedComplexModel(props, 'modelValue', emit);

      const extent = computed({
        get() {
          return new Extent(localValue.value);
        },
        set(value) {
          localValue.value = value.toJSON();
        },
      });

      const { actions, destroy } = setupExtentComponentActions(app, extent);

      onUnmounted(() => {
        destroy();
      });

      return {
        localValue,
        actions,
      };
    },
  };
</script>

<style scoped></style>
