<script setup>
  import { ref, computed } from 'vue';
  import { VTooltip } from 'vuetify/components';
  import { createEllipseTooltip } from '../composables.js';

  const props = defineProps({
    title: {
      type: [String, Number],
      default: undefined,
    },
    width: {
      type: [String, Number],
      default: undefined,
    },
    tag: {
      type: String,
      default: 'div',
    },
    tagOptions: {
      type: Object,
      default: () => {},
    },
  });

  const td = ref(null);

  const tooltip = createEllipseTooltip(
    computed(() => td.value),
    computed(() => undefined),
    computed(() => props.title),
  );

  const hasWhiteSpace = computed(() => /\s/.test(props.title));
  // important: tooltip has evaluated before single-line and multi-line class are applied
  const isSingleLine = computed(() => tooltip.value && !hasWhiteSpace.value);
  const isMultiLine = computed(() => tooltip.value && hasWhiteSpace.value);
</script>

<template>
  <td ref="td" :style="{ 'max-width': width }">
    <component
      :is="tag"
      :class="{
        'single-line': isSingleLine,
        'multi-line': isMultiLine,
      }"
      v-bind="tagOptions"
    >
      {{ $st(title) }}
    </component>
    <v-tooltip v-if="tooltip" activator="parent">
      {{ $st(tooltip) }}
    </v-tooltip>
  </td>
</template>

<style scoped>
  .single-line {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .multi-line {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
    height: auto;
    max-height: 96px;
  }
</style>
