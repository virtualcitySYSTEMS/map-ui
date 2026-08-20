<script setup lang="ts">
  import { reactive, watch } from 'vue';
  import type { PropType } from 'vue';
  import { snapTypes } from '@vcmap/core';
  import type { VcsAction } from '../../actions/actionHelper.js';
  import VcsFormSection from '../section/VcsFormSection.ts.vue';

  const model = defineModel<string[]>({
    type: Array as PropType<string[]>,
    default: () => snapTypes.slice(),
  });

  const keyIcons = {
    orthogonal: 'mdi-angle-right',
    parallel: 'mdi-math-norm',
    vertex: 'mdi-square-outline',
    edge: 'mdi-circle-outline',
  };

  function createToggleAction(key: keyof typeof keyIcons): VcsAction {
    function setActive(value: boolean): void {
      if (value && !model.value.includes(key)) {
        model.value = [...model.value, key];
      } else if (!value && model.value.includes(key)) {
        model.value = model.value.filter((i) => i !== key);
      }
    }

    const action = reactive<VcsAction>({
      name: `toggle${key}`,
      icon: keyIcons[key],
      title: `components.editor.snapping.${key}Tooltip`,
      active: model.value.includes(key),
      callback() {
        setActive(!action.active);
      },
    });

    watch(
      () => model.value.includes(key),
      (value) => {
        action.active = value;
      },
      { immediate: true },
    );

    return action;
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
      {{ $st('components.editor.snapping.help') }}
    </div>
  </vcs-form-section>
</template>

<style scoped lang="scss"></style>
