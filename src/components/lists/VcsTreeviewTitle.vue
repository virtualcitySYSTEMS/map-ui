<script setup>
  import { computed, ref } from 'vue';
  import { VTooltip } from 'vuetify/components';
  import { createEllipseTooltip } from '../composables.js';

  const props = defineProps({
    item: {
      type: Object,
      default: undefined,
    },
    cursorPointer: {
      type: Boolean,
      default: false,
    },
  });

  const titleParent = ref();

  const tooltip = createEllipseTooltip(
    computed(() => titleParent.value),
    computed(() => props.item.tooltip),
    computed(() => props.item.title || props.item.name),
  );
</script>
<style lang="scss" scoped>
  .title-parent {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .cursor-pointer {
    cursor: pointer;
  }
</style>
<template>
  <div
    class="title-parent pr-2 vcs-treeview-title w-100"
    :class="{ 'cursor-pointer': cursorPointer }"
    ref="titleParent"
  >
    <span class="w-100">
      {{ $st(item.title || item.name) }}
    </span>
    <v-tooltip v-if="tooltip" activator="parent">
      {{ $st(tooltip) }}
    </v-tooltip>
  </div>
</template>
