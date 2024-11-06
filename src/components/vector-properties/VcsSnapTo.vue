<script setup>
  import { computed, defineModel, reactive } from 'vue';
  import { snapTypes } from '@vcmap/core';
  import VcsFormSection from '../section/VcsFormSection.vue';

  const model = defineModel({
    type: Array,
    required: false,
    default: () => snapTypes.slice(),
  });

  const keyIcons = {
    orthogonal: 'mdi-angle-right',
    parallel: 'mdi-math-norm',
    vertex: 'mdi-square-outline',
    edge: 'mdi-circle-outline',
  };

  function createToggleAction(key) {
    const keyComputed = computed({
      get() {
        return model.value.includes(key);
      },
      set(value) {
        if (value && !keyComputed.value) {
          model.value = [...model.value, key];
        } else {
          model.value = model.value.filter((i) => i !== key);
        }
      },
    });

    return reactive({
      name: `toggele${key}`,
      icon: keyIcons[key],
      title: `components.editor.snapping.${key}Tooltip`,
      active: keyComputed,
      callback() {
        keyComputed.value = !keyComputed.value;
      },
    });
  }

  const headerActions = [
    createToggleAction('orthogonal'),
    createToggleAction('parallel'),
    createToggleAction('vertex'),
    createToggleAction('edge'),
  ];
</script>

<template>
  <vcs-form-section
    heading="components.editor.snapping.title"
    :header-actions="headerActions"
    :action-button-list-overflow-count="4"
  >
    <div class="px-1 py-1">
      {{ $t('components.editor.snapping.help') }}
    </div>
  </vcs-form-section>
</template>

<style scoped lang="scss"></style>
